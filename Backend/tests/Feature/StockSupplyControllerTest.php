<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockSupplyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Supplier $supplier;
    protected Article $article;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);

        $this->category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Category Description'
        ]);

        $this->supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => 'Test Address',
            'phone' => '1234567890',
            'email' => 'supplier@test.com'
        ]);

        $this->article = Article::create([
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 0,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id
        ]);
    }

    /** @test */
    public function it_can_list_all_stock_supplies()
    {
        // Arrange - Create some stock supplies
        StockSupply::create([
            'article_id' => $this->article->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 10,
            'supply_date' => now(),
            'notes' => 'Test notes'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/stock-supplies');

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'article_id',
                        'quantity',
                        'supply_date',
                        'notes',
                        'created_at',
                        'updated_at',
                        'article'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_create_a_stock_supply()
    {
        // Arrange
        $data = [
            'article_id' => $this->article->id,
            'quantity' => 10,
            'supply_date' => now()->toDateTimeString(),
            'notes' => 'Test notes'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/stock-supplies', $data);

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Stock supply added or updated successfully'
            ]);

        $this->assertDatabaseHas('stock_supplies', [
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Test notes'
        ]);

        // Check that article quantity was not updated (only stock supply was updated)
        $this->article->refresh();
        $this->assertEquals(0, $this->article->quantity);
    }

    /** @test */
    public function it_updates_existing_stock_supply_when_adding_more_stock()
    {
        // Arrange - Create initial stock supply
        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'supply_date' => now(),
            'notes' => 'Initial notes'
        ]);

        // Update article quantity manually (since we're not going through the service)
        $this->article->increment('quantity', 10);

        $data = [
            'article_id' => $this->article->id,
            'quantity' => 15,
            'supply_date' => now()->toDateTimeString(),
            'notes' => 'Updated notes'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/stock-supplies', $data);

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Stock supply added or updated successfully'
            ]);

        // Check that we still have only one stock supply (updated instead of creating a new one)
        $this->assertEquals(1, StockSupply::count());

        // Get the updated supply
        $updatedSupply = StockSupply::where('article_id', $this->article->id)->first();

        // The quantity should now be 10 + 15 = 25
        $this->assertEquals(25, $updatedSupply->quantity);
        $this->assertEquals('Updated notes', $updatedSupply->notes);

        // Check that article quantity was not updated (only stock supply was updated)
        $this->article->refresh();
        $this->assertEquals(10, $this->article->quantity);
    }

    /** @test */
    public function it_can_get_stock_by_category()
    {
        // Arrange - Create multiple articles in the same category
        $article2 = Article::create([
            'barcode' => '123456789013',
            'name' => 'Test Article 2',
            'price' => 20.99,
            'quantity' => 0,
            'category_id' => $this->category->id
        ]);

        // Add stock to both articles
        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'supply_date' => now()
        ]);

        StockSupply::create([
            'article_id' => $article2->id,
            'quantity' => 15,
            'supply_date' => now()
        ]);

        // Update article quantities manually (since we're not going through the service)
        $this->article->increment('quantity', 10);
        $article2->increment('quantity', 15);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/stock/category/{$this->category->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'category_id',
                    'category_name',
                    'total_quantity',
                    'articles'
                ]
            ])
            ->assertJson([
                'data' => [
                    'category_id' => $this->category->id,
                    'category_name' => $this->category->name,
                    'total_quantity' => 25 // 10 + 15
                ]
            ]);
    }

    /** @test */
    public function it_can_get_article_supplies()
    {
        // Arrange - Create multiple supplies for the same article

        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'supply_date' => now()
        ]);

        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 15,
            'supply_date' => now()
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/stock/article/{$this->article->id}/supplies");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'article',
                    'supplies'
                ]
            ])
            ->assertJsonCount(2, 'data.supplies');
    }
}
