<?php

namespace Tests\Unit;

use App\Models\Article;
use App\Models\Category;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Services\StockService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockServiceTest extends TestCase
{
    use RefreshDatabase;

    protected StockService $stockService;
    protected Category $category;
    protected Supplier $supplier;
    protected Article $article;

    protected function setUp(): void
    {
        parent::setUp();

        $reportService = new ReportService();
        $this->stockService = new StockService($reportService);

        // Create test data
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
    public function it_adds_new_stock_supply()
    {
        // Arrange
        $supplyData = [
            'article_id' => $this->article->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 10,
            'notes' => 'Test notes'
        ];

        // Act
        $stockSupply = $this->stockService->addSupply($supplyData);
        $this->article->refresh();

        // Assert
        $this->assertInstanceOf(StockSupply::class, $stockSupply);
        $this->assertEquals($this->article->id, $stockSupply->article_id);
        $this->assertEquals(10, $stockSupply->quantity);
        $this->assertEquals('Test notes', $stockSupply->notes);

        // Check that article quantity was updated
        $this->assertEquals(10, $this->article->quantity);

        // Check that a stock movement was created
        $this->assertDatabaseHas('stock_movements', [
            'article_id' => $this->article->id,
            'type' => 'in',
            'quantity' => 10
        ]);
    }

    /** @test */
    public function it_updates_existing_stock_supply_when_adding_more_stock()
    {
        // Arrange - Create initial stock supply
        $initialSupply = $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10,
            'notes' => 'Initial supply'
        ]);

        $this->article->refresh();
        $this->assertEquals(10, $this->article->quantity);

        // Act - Add more stock
        $additionalSupply = $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 15,
            'notes' => 'Additional supply'
        ]);

        $this->article->refresh();

        // Assert - We now create a new supply instead of updating
        $this->assertNotEquals($initialSupply->id, $additionalSupply->id);
        $this->assertEquals(15, $additionalSupply->quantity); // Just the new quantity
        $this->assertEquals('Additional supply', $additionalSupply->notes);

        // Check that article quantity was updated
        $this->assertEquals(25, $this->article->quantity);

        // Check that we have two stock movements
        $this->assertEquals(2, StockMovement::where('article_id', $this->article->id)->count());
    }

    /** @test */
    public function it_gets_stock_by_category()
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
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10
        ]);

        $this->stockService->addSupply([
            'article_id' => $article2->id,
            'quantity' => 15
        ]);

        // Act
        $stockByCategory = $this->stockService->getStockByCategory($this->category->id);

        // Assert
        $this->assertEquals($this->category->id, $stockByCategory['category_id']);
        $this->assertEquals($this->category->name, $stockByCategory['category_name']);
        $this->assertEquals(25, $stockByCategory['total_quantity']); // 10 + 15
        $this->assertCount(2, $stockByCategory['articles']);
    }

    /** @test */
    public function it_gets_article_supplies()
    {
        // Arrange - Create multiple supplies for the same article

        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10
        ]);

        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 15
        ]);

        // Act
        $supplies = $this->stockService->getArticleSupplies($this->article->id);

        // Assert
        $this->assertCount(2, $supplies);
        $this->assertEquals($this->article->id, $supplies[0]->article_id);
    }

    /** @test */
    public function it_gets_article_movements()
    {
        // Arrange - Create some stock movements
        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 10
        ]);

        $this->stockService->addSupply([
            'article_id' => $this->article->id,
            'quantity' => 15
        ]);

        // Act
        $movements = $this->stockService->getArticleMovements($this->article->id);

        // Assert
        $this->assertCount(2, $movements);
        $this->assertEquals('in', $movements[0]->type);

        // The order of movements might vary, so we'll check that both quantities exist
        $quantities = [$movements[0]->quantity, $movements[1]->quantity];
        $this->assertContains(10, $quantities);
        $this->assertContains(15, $quantities);
    }
}
