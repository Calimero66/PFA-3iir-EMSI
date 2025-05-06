<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Article;
use App\Models\StockSupply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierControllerTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);

        // Authenticate the user
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_can_get_all_suppliers(): void
    {
        // Create some suppliers
        Supplier::create([
            'name' => 'Test Supplier 1',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier1@test.com'
        ]);

        Supplier::create([
            'name' => 'Test Supplier 2',
            'address' => '456 Test Ave',
            'phone' => '987-654-3210',
            'email' => 'supplier2@test.com'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'address',
                        'phone',
                        'email',
                        'created_at',
                        'updated_at'
                    ]
                ]
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_can_search_suppliers(): void
    {
        // Create some suppliers
        Supplier::create([
            'name' => 'ABC Company',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'abc@test.com'
        ]);

        Supplier::create([
            'name' => 'XYZ Corporation',
            'address' => '456 Test Ave',
            'phone' => '987-654-3210',
            'email' => 'xyz@test.com'
        ]);

        // Search by name
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers?search=ABC');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'ABC Company');

        // Search by email
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers?search=xyz@test');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'XYZ Corporation');
    }

    public function test_can_sort_suppliers(): void
    {
        // Create some suppliers
        Supplier::create([
            'name' => 'ABC Company',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'abc@test.com'
        ]);

        Supplier::create([
            'name' => 'XYZ Corporation',
            'address' => '456 Test Ave',
            'phone' => '987-654-3210',
            'email' => 'xyz@test.com'
        ]);

        // Sort by name ascending (default)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers?sort_by=name');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'ABC Company')
            ->assertJsonPath('data.1.name', 'XYZ Corporation');

        // Sort by name descending
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers?sort_by=name&sort_direction=desc');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'XYZ Corporation')
            ->assertJsonPath('data.1.name', 'ABC Company');
    }

    public function test_can_create_supplier(): void
    {
        // Supplier data
        $supplierData = [
            'name' => 'New Supplier',
            'address' => '789 New St',
            'phone' => '555-123-4567',
            'email' => 'newsupplier@test.com'
        ];

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/suppliers', $supplierData);

        // Assert the response
        $response->assertStatus(201)
            ->assertJsonPath('message', 'Supplier created successfully')
            ->assertJsonPath('supplier.name', 'New Supplier')
            ->assertJsonPath('supplier.email', 'newsupplier@test.com');

        // Assert the data was stored in the database
        $this->assertDatabaseHas('suppliers', [
            'name' => 'New Supplier',
            'address' => '789 New St',
            'phone' => '555-123-4567',
            'email' => 'newsupplier@test.com'
        ]);
    }

    public function test_cannot_create_supplier_with_duplicate_email(): void
    {
        // Create a supplier
        Supplier::create([
            'name' => 'Existing Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'existing@test.com'
        ]);

        // Try to create another supplier with the same email
        $supplierData = [
            'name' => 'New Supplier',
            'address' => '789 New St',
            'phone' => '555-123-4567',
            'email' => 'existing@test.com' // Same email as existing supplier
        ];

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/suppliers', $supplierData);

        // Assert the response
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_show_supplier(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id);

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'address',
                    'phone',
                    'email',
                    'created_at',
                    'updated_at'
                ]
            ])
            ->assertJsonPath('data.id', $supplier->id)
            ->assertJsonPath('data.name', $supplier->name)
            ->assertJsonPath('data.email', $supplier->email);
    }

    public function test_can_update_supplier(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Update data
        $updateData = [
            'name' => 'Updated Supplier',
            'address' => '456 Updated St',
            'phone' => '987-654-3210',
            'email' => 'updated@test.com'
        ];

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson('/api/suppliers/' . $supplier->id, $updateData);

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonPath('message', 'Supplier updated successfully')
            ->assertJsonPath('supplier.name', 'Updated Supplier')
            ->assertJsonPath('supplier.email', 'updated@test.com');

        // Assert the data was updated in the database
        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'name' => 'Updated Supplier',
            'address' => '456 Updated St',
            'phone' => '987-654-3210',
            'email' => 'updated@test.com'
        ]);
    }

    public function test_can_partially_update_supplier(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Update only the name
        $updateData = [
            'name' => 'Updated Supplier'
        ];

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson('/api/suppliers/' . $supplier->id, $updateData);

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonPath('message', 'Supplier updated successfully')
            ->assertJsonPath('supplier.name', 'Updated Supplier')
            ->assertJsonPath('supplier.email', 'supplier@test.com'); // Email should remain unchanged

        // Assert the data was updated in the database
        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'name' => 'Updated Supplier',
            'address' => '123 Test St', // Should remain unchanged
            'phone' => '123-456-7890', // Should remain unchanged
            'email' => 'supplier@test.com' // Should remain unchanged
        ]);
    }

    public function test_can_delete_supplier(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/suppliers/' . $supplier->id);

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonPath('message', 'Supplier deleted successfully');

        // Assert the data was deleted from the database
        $this->assertDatabaseMissing('suppliers', [
            'id' => $supplier->id
        ]);
    }

    public function test_cannot_delete_supplier_with_articles(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create an article associated with the supplier
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 99.99,
            'quantity' => 100,
            'supplier_id' => $supplier->id
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/suppliers/' . $supplier->id);

        // Assert the response
        $response->assertStatus(409) // Conflict status code
            ->assertJsonPath('message', 'Cannot delete supplier because it has associated articles')
            ->assertJsonPath('articles_count', 1);

        // Assert the supplier still exists in the database
        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id
        ]);
    }

    public function test_cannot_delete_supplier_with_stock_supplies(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create an article
        $article = Article::create([
            'barcode' => '123456789012',
            'name' => 'Test Article',
            'price' => 99.99,
            'quantity' => 100
        ]);

        // Create a stock supply associated with the supplier
        StockSupply::create([
            'article_id' => $article->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'supply_date' => now(),
            'notes' => 'Test supply'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/suppliers/' . $supplier->id);

        // Assert the response
        $response->assertStatus(409) // Conflict status code
            ->assertJsonPath('message', 'Cannot delete supplier because it has associated stock supplies')
            ->assertJsonPath('stock_supplies_count', 1);

        // Assert the supplier still exists in the database
        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id
        ]);
    }

    public function test_can_get_supplier_articles(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create articles associated with the supplier
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Article 1',
            'price' => 99.99,
            'quantity' => 100,
            'supplier_id' => $supplier->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Article 2',
            'price' => 199.99,
            'quantity' => 200,
            'supplier_id' => $supplier->id
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonStructure([
                'supplier',
                'articles' => [
                    '*' => [
                        'id',
                        'barcode',
                        'name',
                        'price',
                        'quantity',
                        'supplier_id',
                        'created_at',
                        'updated_at'
                    ]
                ],
                'total_count',
                'total_quantity'
            ])
            ->assertJsonCount(2, 'articles')
            ->assertJsonPath('total_count', 2)
            ->assertJsonPath('total_quantity', 300);
    }

    public function test_can_search_supplier_articles(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create articles associated with the supplier
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Laptop',
            'price' => 999.99,
            'quantity' => 10,
            'supplier_id' => $supplier->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Smartphone',
            'price' => 499.99,
            'quantity' => 20,
            'supplier_id' => $supplier->id
        ]);

        // Search by name
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles?search=Laptop');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'articles')
            ->assertJsonPath('articles.0.name', 'Laptop');

        // Search by barcode
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles?search=123456789013');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'articles')
            ->assertJsonPath('articles.0.name', 'Smartphone');
    }

    public function test_can_filter_supplier_articles_by_low_stock(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create articles associated with the supplier
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Low Stock Item',
            'price' => 99.99,
            'quantity' => 5, // Below default threshold of 10
            'supplier_id' => $supplier->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'High Stock Item',
            'price' => 199.99,
            'quantity' => 20, // Above default threshold
            'supplier_id' => $supplier->id
        ]);

        // Filter by low stock
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles?low_stock=true');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'articles')
            ->assertJsonPath('articles.0.name', 'Low Stock Item');

        // Filter by low stock with custom threshold
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles?low_stock=true&threshold=15');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'articles')
            ->assertJsonPath('articles.0.name', 'Low Stock Item');

        // Filter by low stock with higher threshold to include both items
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/articles?low_stock=true&threshold=25');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(2, 'articles');
    }

    public function test_can_get_supplier_stock_supplies(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create articles
        $article1 = Article::create([
            'barcode' => '123456789012',
            'name' => 'Article 1',
            'price' => 99.99,
            'quantity' => 100
        ]);

        $article2 = Article::create([
            'barcode' => '123456789013',
            'name' => 'Article 2',
            'price' => 199.99,
            'quantity' => 200
        ]);

        // Create stock supplies associated with the supplier
        StockSupply::create([
            'article_id' => $article1->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'supply_date' => now(),
            'notes' => 'Supply 1'
        ]);

        StockSupply::create([
            'article_id' => $article2->id,
            'supplier_id' => $supplier->id,
            'quantity' => 200,
            'supply_date' => now()->subDay(),
            'notes' => 'Supply 2'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/stock-supplies');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonStructure([
                'supplier',
                'stock_supplies' => [
                    '*' => [
                        'id',
                        'article_id',
                        'supplier_id',
                        'quantity',
                        'supply_date',
                        'notes',
                        'created_at',
                        'updated_at',
                        'article' => [
                            'id',
                            'barcode',
                            'name',
                            'price',
                            'quantity'
                        ]
                    ]
                ],
                'total_count',
                'total_quantity'
            ])
            ->assertJsonCount(2, 'stock_supplies')
            ->assertJsonPath('total_count', 2)
            ->assertJsonPath('total_quantity', 300);
    }

    public function test_can_filter_supplier_stock_supplies_by_date_range(): void
    {
        // Create a supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]);

        // Create articles
        $article1 = Article::create([
            'barcode' => '123456789012',
            'name' => 'Article 1',
            'price' => 99.99,
            'quantity' => 100
        ]);

        $article2 = Article::create([
            'barcode' => '123456789013',
            'name' => 'Article 2',
            'price' => 199.99,
            'quantity' => 200
        ]);

        // Create stock supplies associated with the supplier
        StockSupply::create([
            'article_id' => $article1->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'supply_date' => now(),
            'notes' => 'Recent Supply'
        ]);

        StockSupply::create([
            'article_id' => $article2->id,
            'supplier_id' => $supplier->id,
            'quantity' => 200,
            'supply_date' => now()->subDays(10),
            'notes' => 'Old Supply'
        ]);

        // Filter by recent date range
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/stock-supplies?start_date=' . now()->subDay()->toDateTimeString() . '&end_date=' . now()->addDay()->toDateTimeString());

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'stock_supplies')
            ->assertJsonPath('stock_supplies.0.notes', 'Recent Supply');

        // Filter by older date range
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/' . $supplier->id . '/stock-supplies?start_date=' . now()->subDays(15)->toDateTimeString() . '&end_date=' . now()->subDays(5)->toDateTimeString());

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(1, 'stock_supplies')
            ->assertJsonPath('stock_supplies.0.notes', 'Old Supply');
    }

    public function test_can_get_suppliers_with_counts(): void
    {
        // Create suppliers
        $supplier1 = Supplier::create([
            'name' => 'Supplier 1',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier1@test.com'
        ]);

        $supplier2 = Supplier::create([
            'name' => 'Supplier 2',
            'address' => '456 Test Ave',
            'phone' => '987-654-3210',
            'email' => 'supplier2@test.com'
        ]);

        // Create articles associated with supplier1
        Article::create([
            'barcode' => '123456789012',
            'name' => 'Article 1',
            'price' => 99.99,
            'quantity' => 100,
            'supplier_id' => $supplier1->id
        ]);

        Article::create([
            'barcode' => '123456789013',
            'name' => 'Article 2',
            'price' => 199.99,
            'quantity' => 200,
            'supplier_id' => $supplier1->id
        ]);

        // Create an article associated with supplier2
        Article::create([
            'barcode' => '123456789014',
            'name' => 'Article 3',
            'price' => 299.99,
            'quantity' => 300,
            'supplier_id' => $supplier2->id
        ]);

        // Create stock supplies
        $articles = Article::all();
        $article1 = $articles[0];
        $article2 = $articles[1];
        $article3 = $articles[2];

        StockSupply::create([
            'article_id' => $article1->id,
            'supplier_id' => $supplier1->id,
            'quantity' => 100,
            'supply_date' => now(),
            'notes' => 'Supply 1'
        ]);

        StockSupply::create([
            'article_id' => $article2->id,
            'supplier_id' => $supplier1->id,
            'quantity' => 200,
            'supply_date' => now(),
            'notes' => 'Supply 2'
        ]);

        StockSupply::create([
            'article_id' => $article3->id,
            'supplier_id' => $supplier2->id,
            'quantity' => 300,
            'supply_date' => now(),
            'notes' => 'Supply 3'
        ]);

        // Make the request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/suppliers/with-counts');

        // Assert the response
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'address',
                        'phone',
                        'email',
                        'created_at',
                        'updated_at',
                        'articles_count',
                        'stock_supplies_count'
                    ]
                ]
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.articles_count', 2)
            ->assertJsonPath('data.0.stock_supplies_count', 2)
            ->assertJsonPath('data.1.articles_count', 1)
            ->assertJsonPath('data.1.stock_supplies_count', 1);
    }
}
