<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleStockUpdateTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $token;
    private $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);

        // Authenticate the user
        $this->token = $this->user->createToken('test-token')->plainTextToken;

        // Create a supplier
        $this->supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);
    }

    public function test_can_create_new_article_with_stock(): void
    {
        // Generate a random barcode to ensure uniqueness
        $barcode = '1' . str_pad(rand(0, 99999999999), 11, '0', STR_PAD_LEFT);
        
        $articleData = [
            'barcode' => $barcode,
            'name' => 'New Test Article',
            'price' => 99.99,
            'quantity' => 100,
            'supplier_id' => $this->supplier->id
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/articles', $articleData);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Article created successfully')
            ->assertJsonPath('article.barcode', $barcode);

        $articleId = $response->json('article.id');
        
        $this->assertDatabaseHas('articles', [
            'id' => $articleId,
            'barcode' => $barcode,
            'quantity' => 100
        ]);

        $this->assertDatabaseHas('stock_supplies', [
            'article_id' => $articleId,
            'supplier_id' => $this->supplier->id,
            'quantity' => 100
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'article_id' => $articleId,
            'type' => 'in',
            'quantity' => 100
        ]);
    }

    public function test_can_update_existing_article_stock(): void
    {
        // First create an article with a random barcode
        $barcode = '2' . str_pad(rand(0, 99999999999), 11, '0', STR_PAD_LEFT);
        
        $article = Article::create([
            'barcode' => $barcode,
            'name' => 'Test Article',
            'price' => 99.99,
            'quantity' => 100
        ]);

        // Now try to add more stock with the same barcode
        $articleData = [
            'barcode' => $barcode,
            'name' => 'Test Article',
            'price' => 99.99,
            'quantity' => 50,
            'supplier_id' => $this->supplier->id
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/articles', $articleData);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Article stock updated successfully')
            ->assertJsonPath('article.barcode', $barcode);

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'barcode' => $barcode,
            'quantity' => 150
        ]);

        $this->assertDatabaseHas('stock_supplies', [
            'article_id' => $article->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 50
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'article_id' => $article->id,
            'type' => 'in',
            'quantity' => 50
        ]);
    }

    public function test_can_update_existing_article_price(): void
    {
        // First create an article with a random barcode
        $barcode = '3' . str_pad(rand(0, 99999999999), 11, '0', STR_PAD_LEFT);
        
        $article = Article::create([
            'barcode' => $barcode,
            'name' => 'Test Article',
            'price' => 99.99,
            'quantity' => 100
        ]);

        // Now try to update the price with the same barcode
        $articleData = [
            'barcode' => $barcode,
            'name' => 'Test Article',
            'price' => 129.99, // New price
            'quantity' => 50,
            'supplier_id' => $this->supplier->id
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/articles', $articleData);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Article stock updated successfully')
            ->assertJsonPath('article.barcode', $barcode);

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'barcode' => $barcode,
            'price' => 129.99,
            'quantity' => 150
        ]);
    }
}
