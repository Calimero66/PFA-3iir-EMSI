# Stock Movements API Guide

## Overview

The Stock Movements API provides endpoints to retrieve and manage stock movement records in your inventory system. Stock movements track all inventory changes including stock additions (type: 'in') and stock reductions (type: 'out').

## Available Endpoints

### 1. Get All Stock Movements

**Endpoint:** `GET /api/stock-movements`

**Description:** Retrieves all stock movements with related article, category, supplier, and report information.

**Response Format:**
```json
{
    "success": true,
    "message": "Stock movements retrieved successfully",
    "data": [
        {
            "id": 1,
            "type": "in",
            "quantity": 100,
            "date": "2025-06-27 10:00:00",
            "reason": "Initial stock for Product A",
            "created_at": "2025-06-27T10:00:00.000000Z",
            "updated_at": "2025-06-27T10:00:00.000000Z",
            "article": {
                "id": 1,
                "name": "Product A",
                "barcode": "123456789012",
                "price": "15.99",
                "category": {
                    "id": 1,
                    "name": "Electronics"
                },
                "supplier": {
                    "id": 1,
                    "name": "Tech Supplier Inc"
                }
            },
            "report": {
                "id": 1,
                "type": "supply",
                "report_date": "2025-06-27T10:00:00.000000Z"
            }
        }
    ],
    "total": 12
}
```

### 2. Get Specific Stock Movement

**Endpoint:** `GET /api/stock-movements/{id}`

**Description:** Retrieves a specific stock movement by ID with all related information.

**Parameters:**
- `id` (required): The ID of the stock movement

**Response Format:**
```json
{
    "success": true,
    "message": "Stock movement retrieved successfully",
    "data": {
        "id": 1,
        "type": "out",
        "quantity": 25,
        "date": "2025-06-27 14:30:00",
        "reason": "Sale of Product A",
        "created_at": "2025-06-27T14:30:00.000000Z",
        "updated_at": "2025-06-27T14:30:00.000000Z",
        "article": {
            "id": 1,
            "name": "Product A",
            "barcode": "123456789012",
            "price": "15.99",
            "category": {
                "id": 1,
                "name": "Electronics"
            },
            "supplier": {
                "id": 1,
                "name": "Tech Supplier Inc"
            }
        },
        "report": {
            "id": 2,
            "type": "sale",
            "report_date": "2025-06-27T14:30:00.000000Z"
        }
    }
}
```

## Stock Movement Types

- **`in`**: Stock additions (purchases, returns, adjustments increasing inventory)
- **`out`**: Stock reductions (sales, damages, adjustments decreasing inventory)

## Related Data

Each stock movement includes:

1. **Article Information**: Name, barcode, price of the affected product
2. **Category**: Product category (if assigned)
3. **Supplier**: Product supplier (if assigned)
4. **Report**: Associated report record (if exists)

## Usage Examples

### Using cURL

```bash
# Get all stock movements
curl -X GET "http://your-domain.com/api/stock-movements" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN"

# Get specific stock movement
curl -X GET "http://your-domain.com/api/stock-movements/1" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript (Fetch API)

```javascript
// Get all stock movements
fetch('/api/stock-movements', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
    }
})
.then(response => response.json())
.then(data => {
    console.log('Stock movements:', data.data);
    console.log('Total count:', data.total);
});

// Get specific stock movement
fetch('/api/stock-movements/1', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
    }
})
.then(response => response.json())
.then(data => {
    console.log('Stock movement details:', data.data);
});
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **404**: Stock movement not found
- **500**: Server error

Error response format:
```json
{
    "success": false,
    "message": "Failed to retrieve stock movement",
    "error": "Error details here"
}
```

## Notes

- Stock movements are ordered by date (most recent first) in the index endpoint
- All dates are returned in ISO 8601 format
- The API requires authentication (Bearer token)
- Related data (category, supplier, report) may be null if not assigned
