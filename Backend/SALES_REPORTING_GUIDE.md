# Sales Reporting System - Enhanced Features

## Overview

Your sales reporting system now includes comprehensive analytics and detailed item-level tracking. The system captures individual items sold within each order and provides detailed breakdowns for sales analysis.

## Database Structure

### Core Tables
- **orders**: Contains order header information (user_id, total_amount)
- **order_lines**: Tracks individual items sold (article_id, quantity, unit_price, line_total)
- **articles**: Product information (name, barcode, price, category)
- **reports**: Links sales to detailed reporting (order_line_id, stock_movement_id)
- **stock_movements**: Tracks inventory changes for each sale

### Key Relationships
```
Order (1) → OrderLines (many) → Articles (1)
OrderLines (1) → Reports (1) → StockMovements (1)
```

## API Endpoints

### Sales Analytics Endpoints

#### 1. Sales Summary
```
GET /api/reports/sales/summary?start_date=2024-01-01&end_date=2024-12-31
```
Returns comprehensive sales summary with:
- Total revenue, quantity sold, orders count
- Items sold breakdown with quantities
- Category performance
- Top selling items

#### 2. Comprehensive Sales Analytics
```
GET /api/reports/sales/analytics?start_date=2024-01-01&end_date=2024-12-31
```
Returns detailed analytics including:
- Overview metrics
- Daily sales data for charts
- Top products analysis
- Category performance
- Sales trends with growth metrics

#### 3. Daily Sales Data
```
GET /api/reports/sales/daily?start_date=2024-01-01&end_date=2024-12-31
```
Returns daily breakdown for charts:
- Date, revenue, quantity, orders per day

#### 4. Top Selling Products
```
GET /api/reports/sales/top-products?limit=10&start_date=2024-01-01
```
Returns top selling products with:
- Total quantity sold
- Total revenue
- Times sold
- Average price

#### 5. Item-Level Sales Report
```
GET /api/reports/sales/item/{articleId}?start_date=2024-01-01&end_date=2024-12-31
```
Returns detailed report for specific item:
- Article information
- Sales summary (quantity, revenue, orders)
- Complete sales history

#### 6. Sales Reports List
```
GET /api/reports/sales/list?start_date=2024-01-01&end_date=2024-12-31
```
Returns filtered list of sales reports with full details

## Example Usage

### Recording a Sale with Multiple Items

When you process a sale using the existing `POST /api/orders/sell` endpoint:

```json
{
  "items": [
    {
      "barcode": "123456789001",
      "quantity": 100
    },
    {
      "barcode": "123456789002", 
      "quantity": 20
    }
  ],
  "notes": "Customer purchase"
}
```

The system automatically:
1. Creates an Order record
2. Creates OrderLine records for each item (100 milk, 20 beef)
3. Updates stock quantities
4. Creates StockMovement records
5. Generates Report records linked to each OrderLine

### Retrieving Sales Data

#### Get Sales Summary
```bash
curl -H "Authorization: Bearer {token}" \
  "http://your-api/api/reports/sales/summary?start_date=2024-01-01&end_date=2024-12-31"
```

Response:
```json
{
  "data": {
    "summary": {
      "total_revenue": 1250.50,
      "total_quantity_sold": 450,
      "total_orders": 25,
      "average_order_value": 50.02
    },
    "items_sold": [
      {
        "article_id": 1,
        "article_name": "Milk",
        "article_barcode": "123456789001",
        "category": "Dairy",
        "total_quantity": 300,
        "total_revenue": 750.00,
        "unit_price": 2.50
      },
      {
        "article_id": 2,
        "article_name": "Beef",
        "article_barcode": "123456789002", 
        "category": "Meat",
        "total_quantity": 150,
        "total_revenue": 500.50,
        "unit_price": 15.00
      }
    ],
    "category_sales": [
      {
        "category_name": "Dairy",
        "total_quantity": 300,
        "total_revenue": 750.00,
        "items_count": 5
      }
    ],
    "top_selling_items": [...]
  }
}
```

#### Get Item-Level Report
```bash
curl -H "Authorization: Bearer {token}" \
  "http://your-api/api/reports/sales/item/1?start_date=2024-01-01"
```

Response:
```json
{
  "data": {
    "article": {
      "id": 1,
      "name": "Milk",
      "barcode": "123456789001",
      "current_price": 2.50,
      "category": "Dairy",
      "current_stock": 50
    },
    "sales_summary": {
      "total_quantity_sold": 300,
      "total_revenue": 750.00,
      "total_orders": 15,
      "average_price": 2.50,
      "average_quantity_per_order": 20.0
    },
    "sales_history": [
      {
        "order_id": 123,
        "sale_date": "2024-01-15 10:30:00",
        "quantity": 100,
        "unit_price": 2.50,
        "line_total": 250.00
      },
      {
        "order_id": 124,
        "sale_date": "2024-01-16 14:20:00", 
        "quantity": 20,
        "unit_price": 2.50,
        "line_total": 50.00
      }
    ]
  }
}
```

## Key Features

### ✅ Individual Item Tracking
- Each sale captures exact quantities of specific products
- Example: "100 units of milk" and "20 units of beef" in one order
- Full traceability from order to individual items

### ✅ Comprehensive Analytics
- Revenue analysis by product, category, and time period
- Quantity tracking for inventory insights
- Performance metrics and growth trends

### ✅ Flexible Reporting
- Date range filtering for all reports
- Item-level detailed breakdowns
- Category and supplier analysis

### ✅ Dashboard-Ready Data
- Daily sales data formatted for charts
- Top products rankings
- Growth metrics and comparisons

## Testing

Run the comprehensive test suite:
```bash
php artisan test tests/Feature/SalesAnalyticsTest.php
```

The tests verify:
- Individual item tracking in orders
- Sales summary generation
- Item-level reporting
- Date range filtering
- Top products analysis

## Integration Notes

- All existing functionality remains unchanged
- New endpoints are additive enhancements
- Existing order processing automatically generates detailed reports
- No database migrations required (uses existing structure)
- Full backward compatibility maintained
