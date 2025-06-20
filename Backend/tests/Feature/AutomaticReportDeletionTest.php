<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Report;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\User;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutomaticReportDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user with proper role
        $this->user = User::factory()->create([
            'role' => 'Admin'
        ]);

        // Create test category and supplier
        $this->category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Category Description'
        ]);
        $this->supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => 'Test Address',
            'phone' => '1234567890',
            'email' => 'test@supplier.com'
        ]);
    }

    /** @test */
    public function it_deletes_reports_when_article_is_deleted()
    {
        // Create an article using the API
        $articleData = [
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.00,
            'quantity' => 100,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id,
        ];

        $createResponse = $this->actingAs($this->user)
            ->postJson('/api/articles', $articleData);

        $createResponse->assertStatus(201);
        $articleId = $createResponse->json('article.id');
        $article = Article::find($articleId);

        // Create stock movements for the article
        $stockMovement1 = StockMovement::create([
            'article_id' => $article->id,
            'type' => 'in',
            'quantity' => 50,
            'date' => now(),
            'reason' => 'Initial stock'
        ]);

        $stockMovement2 = StockMovement::create([
            'article_id' => $article->id,
            'type' => 'out',
            'quantity' => 10,
            'date' => now(),
            'reason' => 'Sale'
        ]);

        // Create reports for these stock movements
        $report1 = Report::create([
            'type' => 'supply',
            'report_date' => now(),
            'user_id' => $this->user->id,
            'stock_movement_id' => $stockMovement1->id,
            'details' => 'Supply report'
        ]);

        $report2 = Report::create([
            'type' => 'sale',
            'report_date' => now(),
            'user_id' => $this->user->id,
            'stock_movement_id' => $stockMovement2->id,
            'details' => 'Sale report'
        ]);

        // Verify reports exist
        $this->assertDatabaseHas('reports', ['id' => $report1->id]);
        $this->assertDatabaseHas('reports', ['id' => $report2->id]);

        // Delete the article
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/articles/{$article->id}");

        // Debug the response
        if ($response->getStatusCode() !== 200) {
            echo "Response Status: " . $response->getStatusCode() . "\n";
            echo "Response Content: " . $response->getContent() . "\n";
        }

        // Assert successful deletion
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'deleted_article_id',
            'deleted_article_name',
            'deleted_reports',
            'deleted_reports_count'
        ]);

        // Verify article is deleted
        $this->assertDatabaseMissing('articles', ['id' => $article->id]);

        // Verify reports are deleted
        $this->assertDatabaseMissing('reports', ['id' => $report1->id]);
        $this->assertDatabaseMissing('reports', ['id' => $report2->id]);

        // Verify stock movements are deleted (cascade)
        $this->assertDatabaseMissing('stock_movements', ['id' => $stockMovement1->id]);
        $this->assertDatabaseMissing('stock_movements', ['id' => $stockMovement2->id]);
    }

    /** @test */
    public function it_deletes_reports_when_order_is_deleted()
    {
        // Create an article and stock supply
        $article = Article::create([
            'barcode' => '123456789013',
            'name' => 'Test Article 2',
            'price' => 15.00,
            'quantity' => 50,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id,
            'user_id' => $this->user->id,
        ]);

        $stockSupply = StockSupply::create([
            'article_id' => $article->id,
            'quantity' => 50,
            'supply_date' => now(),
            'notes' => 'Initial supply'
        ]);

        // Create an order
        $order = Order::create([
            'user_id' => $this->user->id,
            'total_amount' => 30.00
        ]);

        // Create order line
        $orderLine = OrderLine::create([
            'order_id' => $order->id,
            'article_id' => $article->id,
            'quantity' => 2,
            'unit_price' => 15.00,
            'line_total' => 30.00
        ]);

        // Create stock movement for the sale
        $stockMovement = StockMovement::create([
            'article_id' => $article->id,
            'type' => 'out',
            'quantity' => 2,
            'date' => now(),
            'reason' => 'Sale'
        ]);

        // Create report for this order line
        $report = Report::create([
            'type' => 'sale',
            'report_date' => now(),
            'user_id' => $this->user->id,
            'stock_movement_id' => $stockMovement->id,
            'order_line_id' => $orderLine->id,
            'details' => 'Sale report for order'
        ]);

        // Verify report exists
        $this->assertDatabaseHas('reports', ['id' => $report->id]);

        // Delete the order
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/orders/{$order->id}");

        // Assert successful deletion
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'deleted_order_id',
            'restored_items',
            'deleted_reports',
            'deleted_reports_count'
        ]);

        // Verify order is deleted
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);

        // Verify report is deleted
        $this->assertDatabaseMissing('reports', ['id' => $report->id]);

        // Verify order line is deleted (cascade)
        $this->assertDatabaseMissing('order_lines', ['id' => $orderLine->id]);
    }
}
