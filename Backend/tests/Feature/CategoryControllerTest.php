<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);
    }

    /** @test */
    public function it_can_list_all_categories()
    {
        // Arrange - Create some categories
        Category::create([
            'name' => 'Category 1',
            'description' => 'Description 1'
        ]);

        Category::create([
            'name' => 'Category 2',
            'description' => 'Description 2'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/categories');

        // Assert
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'created_at',
                        'updated_at'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_create_a_category()
    {
        // Arrange
        $data = [
            'name' => 'New Category',
            'description' => 'New Category Description'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/categories', $data);

        // Assert
        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Category created successfully'
            ])
            ->assertJsonStructure([
                'category' => [
                    'id',
                    'name',
                    'description',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'New Category',
            'description' => 'New Category Description'
        ]);
    }

    /** @test */
    public function it_can_show_a_category()
    {
        // Arrange
        $category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Description'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/categories/{$category->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $category->id,
                    'name' => 'Test Category',
                    'description' => 'Test Description'
                ]
            ]);
    }

    /** @test */
    public function it_can_update_a_category()
    {
        // Arrange
        $category = Category::create([
            'name' => 'Original Name',
            'description' => 'Original Description'
        ]);

        $data = [
            'name' => 'Updated Name',
            'description' => 'Updated Description'
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->putJson("/api/categories/{$category->id}", $data);

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category updated successfully'
            ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Updated Name',
            'description' => 'Updated Description'
        ]);
    }

    /** @test */
    public function it_can_delete_a_category()
    {
        // Arrange
        $category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Description'
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/categories/{$category->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category deleted successfully'
            ]);

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id
        ]);
    }

    /** @test */
    public function it_can_get_articles_by_category()
    {
        // Arrange
        $category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test Description'
        ]);

        // Create articles in this category
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Article 1',
            'price' => 10.99,
            'quantity' => 5,
            'category_id' => $category->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Article 2',
            'price' => 20.99,
            'quantity' => 10,
            'category_id' => $category->id
        ]);

        // Create an article in a different category
        $otherCategory = Category::create([
            'name' => 'Other Category',
            'description' => 'Other Description'
        ]);

        Article::create([
            'barcode' => '123456789014',
            'name' => 'Other Article',
            'price' => 30.99,
            'quantity' => 15,
            'category_id' => $otherCategory->id
        ]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/categories/{$category->id}/articles");

        // Assert
        $response->assertStatus(200);

        // Get the response data
        $responseData = json_decode($response->getContent(), true);

        // Check that we have the correct articles
        $this->assertArrayHasKey('articles', $responseData);
        $this->assertCount(2, $responseData['articles']);

        // Sort the articles by name to ensure consistent order
        $articleNames = array_column($responseData['articles'], 'name');
        sort($articleNames);

        $this->assertEquals('Article 1', $articleNames[0]);
        $this->assertEquals('Article 2', $articleNames[1]);
    }
}
