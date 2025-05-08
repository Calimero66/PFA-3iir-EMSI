<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Report;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Supplier $supplier;
    protected Article $article;
    protected StockService $stockService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user
        $this->user = User::factory()->create();

        // Create a category
        $this->category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Category Description'
        ]);

        // Create a supplier
        $this->supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => 'Test Address',
            'phone' => '1234567890',
            'email' => 'supplier@test.com'
        ]);

        // Create an article
        $this->article = Article::create([
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 0,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id
        ]);

        // Get the stock service
        $this->stockService = app(StockService::class);
    }

    /** @test */
    public function it_can_list_all_reports()
    {
        // Arrange - Create a stock supply which will generate a report
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test supply'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/reports');

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'report_date',
                        'stock_movement_id',
                        'details',
                        'created_at',
                        'updated_at',
                        'stock_movement' => [
                            'article'
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_show_a_report()
    {
        // Arrange - Create a stock supply which will generate a report
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test supply'
        ]);

        $report = Report::first();

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/{$report->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'report_date',
                    'stock_movement_id',
                    'details',
                    'created_at',
                    'updated_at',
                    'stock_movement' => [
                        'article'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_generate_a_ticket_for_a_report()
    {
        // Arrange - Create a stock supply which will generate a report
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test supply'
        ]);

        $report = Report::first();

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/{$report->id}/ticket");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'report_id',
                    'report_type',
                    'report_date',
                    'details',
                    'article',
                    'movement'
                ]
            ]);
    }

    /** @test */
    public function it_can_get_reports_by_type()
    {
        // Arrange - Create a stock supply which will generate a report
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test supply'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/type/supply');

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'report_date',
                        'stock_movement_id',
                        'details'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_get_reports_by_article()
    {
        // Arrange - Create a stock supply which will generate a report
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test supply'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/article/{$this->article->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'report_date',
                        'stock_movement_id',
                        'details'
                    ]
                ]
            ]);
    }
}
