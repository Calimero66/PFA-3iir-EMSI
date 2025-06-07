<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\StockSupply;
use App\Models\StockMovement;
use App\Models\Report;
use App\Services\SalesAnalyticsService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $category;
    protected $supplier;
    protected $articles;
    protected $salesAnalyticsService;
    protected $reportService;

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

        // Create test articles
        $this->articles = collect([
            Article::create([
                'barcode' => '123456789001',
                'name' => 'Milk',
                'price' => 2.50,
                'quantity' => 100,
                'category_id' => $this->category->id,
                'supplier_id' => $this->supplier->id,
                'user_id' => $this->user->id,
            ]),
            Article::create([
                'barcode' => '123456789002',
                'name' => 'Beef',
                'price' => 15.00,
                'quantity' => 50,
                'category_id' => $this->category->id,
                'supplier_id' => $this->supplier->id,
                'user_id' => $this->user->id,
            ]),
            Article::create([
                'barcode' => '123456789003',
                'name' => 'Bread',
                'price' => 3.00,
                'quantity' => 75,
                'category_id' => $this->category->id,
                'supplier_id' => $this->supplier->id,
                'user_id' => $this->user->id,
            ]),
        ]);

        // Create stock supplies for each article
        foreach ($this->articles as $article) {
            StockSupply::create([
                'article_id' => $article->id,
                'quantity' => $article->quantity,
                'supply_date' => now(),
                'notes' => 'Initial stock'
            ]);
        }

        $this->salesAnalyticsService = new SalesAnalyticsService();
        $this->reportService = new ReportService();
    }

    /** @test */
    public function it_can_track_individual_items_sold_in_orders()
    {
        // Create an order with multiple items
        $order = Order::create([
            'user_id' => $this->user->id,
            'total_amount' => 0,
        ]);

        // Add order lines for different items with different quantities
        $orderLines = [
            OrderLine::create([
                'order_id' => $order->id,
                'article_id' => $this->articles[0]->id, // Milk
                'quantity' => 100,
                'unit_price' => 2.50,
                'line_total' => 250.00,
            ]),
            OrderLine::create([
                'order_id' => $order->id,
                'article_id' => $this->articles[1]->id, // Beef
                'quantity' => 20,
                'unit_price' => 15.00,
                'line_total' => 300.00,
            ]),
            OrderLine::create([
                'order_id' => $order->id,
                'article_id' => $this->articles[2]->id, // Bread
                'quantity' => 5,
                'unit_price' => 3.00,
                'line_total' => 15.00,
            ]),
        ];

        // Update order total
        $order->update(['total_amount' => 565.00]);

        // Test that we can retrieve individual items sold
        $analytics = $this->salesAnalyticsService->getSalesAnalytics();

        $this->assertArrayHasKey('overview', $analytics);
        $this->assertArrayHasKey('top_products', $analytics);

        // Check overview metrics
        $overview = $analytics['overview'];
        $this->assertEquals(565.00, $overview['total_revenue']);
        $this->assertEquals(125, $overview['total_quantity_sold']); // 100 + 20 + 5
        $this->assertEquals(1, $overview['total_orders']);
        $this->assertEquals(3, $overview['unique_products_sold']);

        // Check top products
        $topProducts = $analytics['top_products'];
        $this->assertCount(3, $topProducts);

        // Verify individual item tracking
        $beefProduct = collect($topProducts)->firstWhere('name', 'Beef');
        $this->assertNotNull($beefProduct);
        $this->assertEquals(20, $beefProduct['total_quantity']);
        $this->assertEquals(300.00, $beefProduct['total_revenue']);

        $milkProduct = collect($topProducts)->firstWhere('name', 'Milk');
        $this->assertNotNull($milkProduct);
        $this->assertEquals(100, $milkProduct['total_quantity']);
        $this->assertEquals(250.00, $milkProduct['total_revenue']);
    }

    /** @test */
    public function it_can_generate_sales_summary_with_detailed_breakdown()
    {
        // Create multiple orders with different items
        $this->createSampleSalesData();

        // Test sales summary endpoint
        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/sales/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'summary' => [
                        'total_revenue',
                        'total_quantity_sold',
                        'total_orders',
                        'average_order_value',
                        'date_range'
                    ],
                    'items_sold' => [
                        '*' => [
                            'article_id',
                            'article_name',
                            'article_barcode',
                            'category',
                            'total_quantity',
                            'total_revenue',
                            'unit_price'
                        ]
                    ],
                    'category_sales',
                    'top_selling_items'
                ]
            ]);

        $data = $response->json('data');
        $this->assertGreaterThan(0, $data['summary']['total_revenue']);
        $this->assertGreaterThan(0, count($data['items_sold']));
    }

    /** @test */
    public function it_can_get_item_level_sales_report()
    {
        $this->createSampleSalesData();

        $articleId = $this->articles[0]->id; // Milk

        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/sales/item/{$articleId}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'article' => [
                        'id',
                        'name',
                        'barcode',
                        'current_price',
                        'category',
                        'current_stock'
                    ],
                    'sales_summary' => [
                        'total_quantity_sold',
                        'total_revenue',
                        'total_orders',
                        'average_price',
                        'average_quantity_per_order'
                    ],
                    'sales_history' => [
                        '*' => [
                            'order_id',
                            'sale_date',
                            'quantity',
                            'unit_price',
                            'line_total'
                        ]
                    ]
                ]
            ]);

        $data = $response->json('data');
        $this->assertEquals('Milk', $data['article']['name']);
        $this->assertGreaterThan(0, $data['sales_summary']['total_quantity_sold']);
    }

    /** @test */
    public function it_can_get_daily_sales_data_for_charts()
    {
        $this->createSampleSalesData();

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/sales/daily');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'date',
                        'revenue',
                        'quantity',
                        'orders'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_filter_sales_by_date_range()
    {
        $this->createSampleSalesData();

        $startDate = now()->subDays(7)->toDateString();
        $endDate = now()->toDateString();

        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/sales/analytics?start_date={$startDate}&end_date={$endDate}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'overview',
                    'daily_sales',
                    'top_products',
                    'category_performance',
                    'sales_trends'
                ]
            ]);
    }

    /** @test */
    public function it_can_get_top_selling_products()
    {
        $this->createSampleSalesData();

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/sales/top-products?limit=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'article_id',
                        'name',
                        'barcode',
                        'category',
                        'total_quantity',
                        'total_revenue',
                        'times_sold',
                        'average_price'
                    ]
                ]
            ]);

        $data = $response->json('data');
        $this->assertLessThanOrEqual(5, count($data));
    }

    /**
     * Create sample sales data for testing
     */
    private function createSampleSalesData()
    {
        // Create multiple orders with different combinations of items
        for ($i = 0; $i < 3; $i++) {
            $order = Order::create([
                'user_id' => $this->user->id,
                'total_amount' => 0,
                'created_at' => now()->subDays($i),
            ]);

            $totalAmount = 0;

            // Add different items to each order
            foreach ($this->articles as $index => $article) {
                $quantity = rand(1, 10);
                $unitPrice = $article->price;
                $lineTotal = $quantity * $unitPrice;

                $orderLine = OrderLine::create([
                    'order_id' => $order->id,
                    'article_id' => $article->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ]);

                // Create corresponding stock movement
                $stockMovement = StockMovement::create([
                    'article_id' => $article->id,
                    'type' => 'out',
                    'quantity' => $quantity,
                    'date' => now()->subDays($i),
                    'reason' => "Sale of article {$article->name}",
                ]);

                // Create report linking the order line and stock movement
                Report::create([
                    'type' => 'sale',
                    'report_date' => now()->subDays($i),
                    'user_id' => $this->user->id,
                    'stock_movement_id' => $stockMovement->id,
                    'order_line_id' => $orderLine->id,
                    'details' => "Sale of {$quantity} units of {$article->name}",
                ]);

                $totalAmount += $lineTotal;
            }

            $order->update(['total_amount' => $totalAmount]);
        }
    }
}
