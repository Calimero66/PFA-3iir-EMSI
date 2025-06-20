<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SimpleArticleDeletionTest extends TestCase
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
    public function it_can_delete_a_simple_article()
    {
        // Create a simple article using the API
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

        echo "Created article ID: {$articleId}\n";
        echo "Create response: " . $createResponse->getContent() . "\n";

        // Verify article exists
        $this->assertDatabaseHas('articles', ['id' => $articleId]);

        // Check if article exists before deletion
        $articleBeforeDeletion = Article::find($articleId);
        echo "Article before deletion: " . ($articleBeforeDeletion ? json_encode($articleBeforeDeletion->toArray()) : 'NOT FOUND') . "\n";

        // Delete the article
        echo "Deleting article with URL: /api/articles/{$articleId}\n";
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/articles/{$articleId}");

        // Debug the response
        echo "Response Status: " . $response->getStatusCode() . "\n";
        echo "Response Content: " . $response->getContent() . "\n";

        // Check if article is deleted
        $articleExists = Article::find($articleId);
        echo "Article exists after deletion: " . ($articleExists ? 'YES' : 'NO') . "\n";

        // Assert successful deletion
        $response->assertStatus(200);

        // Verify article is deleted
        $this->assertDatabaseMissing('articles', ['id' => $articleId]);
    }
}
