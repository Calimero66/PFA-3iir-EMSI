<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Supplier $supplier;

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
    }

    /** @test */
    public function it_creates_a_new_article_with_stock_supply()
    {
        // Arrange
        $data = [
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id,
            'notes' => 'Initial stock notes'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/articles', $data);

        // Assert
        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Article created successfully'
            ])
            ->assertJsonStructure([
                'article',
                'stock_supply'
            ]);

        $this->assertDatabaseHas('articles', [
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 10
        ]);

        $this->assertDatabaseHas('stock_supplies', [
            'quantity' => 10,
            'notes' => 'Initial stock notes'
        ]);
    }

    /** @test */
    public function it_creates_new_article_with_same_barcode_and_updates_stock_supply()
    {
        // Arrange - Create an existing article
        $article = Article::create([
            'barcode' => '123456789012',
            'name' => 'Existing Article',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id
        ]);

        // Create an existing stock supply
        StockSupply::create([
            'article_id' => $article->id,
            'quantity' => 10,
            'supply_date' => now(),
            'notes' => 'Initial notes'
        ]);

        // Data for creating a new article with the same barcode but different name
        $data = [
            'barcode' => '123456789012', // Same barcode
            'name' => 'New Article With Same Barcode', // Different name
            'price' => 15.99, // Different price
            'quantity' => 15, // Additional quantity
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id,
            'notes' => 'New article notes'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/articles', $data);

        // Assert
        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Article created successfully'
            ]);

        // Check that we now have two articles
        $this->assertEquals(2, Article::count());

        // Check that we still have only one stock supply (updated instead of creating a new one)
        $this->assertEquals(1, StockSupply::count());

        // Get the new article
        $newArticle = Article::where('name', 'New Article With Same Barcode')->first();

        // Verify the new article was created with the correct data
        $this->assertEquals('123456789012', $newArticle->barcode);
        $this->assertEquals('New Article With Same Barcode', $newArticle->name);
        $this->assertEquals(15.99, $newArticle->price);
        $this->assertEquals(15, $newArticle->quantity);

        // Verify the original article was not changed
        $article->refresh();
        $this->assertEquals('Existing Article', $article->name);
        $this->assertEquals(10.99, $article->price);
        $this->assertEquals(10, $article->quantity);

        // Verify the stock supply was updated
        $stockSupply = StockSupply::first();
        $this->assertEquals(25, $stockSupply->quantity); // 10 + 15
    }

    /** @test */
    public function it_creates_article_without_supplier_and_sets_quantity_directly()
    {
        // Arrange
        $data = [
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id
            // No supplier_id
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/articles', $data);

        // Assert
        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Article created successfully'
            ]);

        $this->assertDatabaseHas('articles', [
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 10.99,
            'quantity' => 10
        ]);

        // A stock supply is created
        $this->assertEquals(1, StockSupply::count());
    }

    /** @test */
    public function it_can_list_articles_by_category()
    {
        // Arrange - Create multiple articles in the same category
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Test Article 1',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Test Article 2',
            'price' => 20.99,
            'quantity' => 15,
            'category_id' => $this->category->id
        ]);

        // Create an article in a different category
        $otherCategory = Category::create([
            'name' => 'Other Category',
            'description' => 'Other Category Description'
        ]);

        Article::create([
            'barcode' => '123456789014',
            'name' => 'Other Article',
            'price' => 30.99,
            'quantity' => 5,
            'category_id' => $otherCategory->id
        ]);

        // Act - Get articles filtered by category
        $response = $this->actingAs($this->user)
            ->getJson("/api/articles?category_id={$this->category->id}");

        // Assert
        $response->assertStatus(200);

        // Get the response data
        $responseData = json_decode($response->getContent(), true);

        // Filter the response data to only include articles with the correct category_id
        $categoryArticles = array_filter($responseData['data'], fn($article) => $article['category_id'] == $this->category->id);

        $this->assertCount(2, $categoryArticles);
    }

    /** @test */
    public function it_can_list_articles_with_low_stock()
    {
        // Arrange - Create articles with different stock levels
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Low Stock Article',
            'price' => 10.99,
            'quantity' => 5, // Below default threshold of 10
            'category_id' => $this->category->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Normal Stock Article',
            'price' => 20.99,
            'quantity' => 20, // Above threshold
            'category_id' => $this->category->id
        ]);

        // Act - Get articles with low stock
        $response = $this->actingAs($this->user)
            ->getJson('/api/articles?low_stock=true');

        // Assert
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Low Stock Article');
    }

    /** @test */
    public function it_rejects_creating_article_with_same_barcode_but_different_category()
    {
        // Arrange - Create an existing article
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Existing Article',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id
        ]);

        // Create a different category
        $otherCategory = Category::create([
            'name' => 'Other Category',
            'description' => 'Other Category Description'
        ]);

        // Data for the new article with the same barcode but different category
        $data = [
            'barcode' => '123456789012', // Same barcode
            'name' => 'New Article Different Category',
            'price' => 15.99,
            'quantity' => 5,
            'category_id' => $otherCategory->id, // Different category
            'supplier_id' => $this->supplier->id,
            'notes' => 'New article with same barcode but different category'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/articles', $data);

        // Assert
        $response->assertStatus(422)
            ->assertJson([
                'message' => 'An article with this barcode already exists in a different category'
            ]);

        // Check that we still have only one article with this barcode
        $this->assertEquals(1, Article::where('barcode', '123456789012')->count());
    }

    /** @test */
    public function it_creates_new_article_with_same_barcode_and_same_category()
    {
        // Arrange - Create an existing article
        $existingArticle = Article::create([
            'barcode' => '123456789012',
            'name' => 'Existing Article',
            'price' => 10.99,
            'quantity' => 10,
            'category_id' => $this->category->id,
            'supplier_id' => $this->supplier->id
        ]);

        // Create an existing stock supply
        StockSupply::create([
            'article_id' => $existingArticle->id,
            'quantity' => 10,
            'supply_date' => now(),
            'notes' => 'Initial notes'
        ]);

        // Data for creating a new article with the same barcode and same category
        $data = [
            'barcode' => '123456789012', // Same barcode
            'name' => 'New Article Same Barcode', // Different name
            'price' => 15.99, // Different price
            'quantity' => 5, // Additional quantity
            'category_id' => $this->category->id, // Same category
            'supplier_id' => $this->supplier->id,
            'notes' => 'Additional stock for existing article'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/articles', $data);

        // Assert
        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Article created successfully'
            ]);

        // Check that we now have two articles with this barcode
        $this->assertEquals(2, Article::where('barcode', '123456789012')->count());

        // Get the new article
        $newArticle = Article::where('name', 'New Article Same Barcode')->first();

        // Verify the new article was created with the correct data
        $this->assertEquals('123456789012', $newArticle->barcode);
        $this->assertEquals('New Article Same Barcode', $newArticle->name);
        $this->assertEquals(15.99, $newArticle->price);
        $this->assertEquals(5, $newArticle->quantity);

        // Verify the original article was not changed
        $existingArticle->refresh();
        $this->assertEquals('Existing Article', $existingArticle->name);
        $this->assertEquals(10.99, $existingArticle->price);
        $this->assertEquals(10, $existingArticle->quantity);

        // Verify the stock supply was updated
        $stockSupply = StockSupply::first();
        $this->assertEquals(15, $stockSupply->quantity); // 10 + 5
    }
}
