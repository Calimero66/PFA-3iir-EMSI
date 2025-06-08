<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\StockSupply;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockSupplyWithArticleNameTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $category;
    protected $supplier;
    protected $article;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'Admin'
        ]);

        // Create test category
        $this->category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test category description'
        ]);

        // Create test supplier
        $this->supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => 'Test Address',
            'phone' => '1234567890',
            'email' => 'supplier@test.com'
        ]);

        // Create test article
        $this->article = Article::create([
            'barcode' => '123456789001',
            'name' => 'Test Milk Product',
            'price' => 2.50,
            'quantity' => 100,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_includes_article_name_in_stock_supplies_list()
    {
        // Create a stock supply
        $stockSupply = StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 50,
            'supply_date' => now(),
            'notes' => 'Test supply'
        ]);

        // Test the index endpoint
        $response = $this->actingAs($this->user)
            ->getJson('/api/stock-supplies');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'article_id',
                        'article_name',
                        'article_barcode',
                        'article_price',
                        'category_name',
                        'supplier_name',
                        'quantity',
                        'supply_date',
                        'notes',
                        'created_at',
                        'updated_at',
                        'article'
                    ]
                ]
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Test Milk Product', $data[0]['article_name']);
        $this->assertEquals('123456789001', $data[0]['article_barcode']);
        $this->assertEquals('Test Category', $data[0]['category_name']);
        $this->assertEquals('Test Supplier', $data[0]['supplier_name']);
        $this->assertEquals(50, $data[0]['quantity']);
    }

    /** @test */
    public function it_includes_article_name_in_single_stock_supply()
    {
        // Create a stock supply
        $stockSupply = StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 50,
            'supply_date' => now(),
            'notes' => 'Test supply'
        ]);

        // Test the show endpoint
        $response = $this->actingAs($this->user)
            ->getJson("/api/stock-supplies/{$stockSupply->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'article_id',
                    'article_name',
                    'article_barcode',
                    'article_price',
                    'category_name',
                    'supplier_name',
                    'quantity',
                    'supply_date',
                    'notes',
                    'created_at',
                    'updated_at',
                    'article'
                ]
            ]);

        $data = $response->json('data');
        $this->assertEquals('Test Milk Product', $data['article_name']);
        $this->assertEquals('123456789001', $data['article_barcode']);
        $this->assertEquals(2.50, $data['article_price']);
        $this->assertEquals('Test Category', $data['category_name']);
        $this->assertEquals('Test Supplier', $data['supplier_name']);
    }

    /** @test */
    public function it_includes_article_name_in_article_supplies_endpoint()
    {
        // Create multiple stock supplies for the same article
        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 30,
            'supply_date' => now()->subDays(2),
            'notes' => 'First supply'
        ]);

        StockSupply::create([
            'article_id' => $this->article->id,
            'quantity' => 20,
            'supply_date' => now()->subDays(1),
            'notes' => 'Second supply'
        ]);

        // Test the article supplies endpoint
        $response = $this->actingAs($this->user)
            ->getJson("/api/stock/article/{$this->article->id}/supplies");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'article' => [
                        'id',
                        'name',
                        'barcode',
                        'price',
                        'current_quantity',
                        'category_name',
                        'supplier_name'
                    ],
                    'supplies' => [
                        '*' => [
                            'id',
                            'article_id',
                            'article_name',
                            'article_barcode',
                            'article_price',
                            'quantity',
                            'supply_date',
                            'notes',
                            'created_at',
                            'updated_at'
                        ]
                    ],
                    'total_supplies',
                    'total_quantity_supplied'
                ]
            ]);

        $data = $response->json('data');
        
        // Check article information
        $this->assertEquals('Test Milk Product', $data['article']['name']);
        $this->assertEquals('Test Category', $data['article']['category_name']);
        $this->assertEquals('Test Supplier', $data['article']['supplier_name']);
        
        // Check supplies
        $this->assertCount(2, $data['supplies']);
        $this->assertEquals(2, $data['total_supplies']);
        $this->assertEquals(50, $data['total_quantity_supplied']); // 30 + 20
        
        // Check that each supply includes article name and price
        foreach ($data['supplies'] as $supply) {
            $this->assertEquals('Test Milk Product', $supply['article_name']);
            $this->assertEquals('123456789001', $supply['article_barcode']);
            $this->assertEquals(2.50, $supply['article_price']);
        }
    }

    /** @test */
    public function it_includes_article_name_when_creating_stock_supply()
    {
        // Test creating a new stock supply
        $response = $this->actingAs($this->user)
            ->postJson('/api/stock-supplies', [
                'article_id' => $this->article->id,
                'quantity' => 75,
                'supply_date' => now()->toDateString(),
                'notes' => 'New test supply'
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'article_id',
                    'article_name',
                    'article_barcode',
                    'category_name',
                    'supplier_name',
                    'quantity',
                    'supply_date',
                    'notes',
                    'created_at',
                    'updated_at',
                    'article'
                ]
            ]);

        $data = $response->json('data');
        $this->assertEquals('Test Milk Product', $data['article_name']);
        $this->assertEquals('123456789001', $data['article_barcode']);
        $this->assertEquals(2.50, $data['article_price']);
        $this->assertEquals('Test Category', $data['category_name']);
        $this->assertEquals('Test Supplier', $data['supplier_name']);
        $this->assertEquals(75, $data['quantity']);
    }
}
