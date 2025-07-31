# Dashboard API Documentation

## Overview
Dashboard API cung cấp các endpoint để lấy dữ liệu thống kê cho Representative dashboard.

## Base URL
```
/api/dashboard
```

## Authentication
Tất cả các endpoint đều yêu cầu authentication token trong header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. GET /api/dashboard/representative
Lấy dữ liệu tổng quan cho Representative dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalExportOrders": 15,
      "totalImportOrders": 8,
      "totalContracts": 12,
      "totalValue": 15000000
    },
    "monthlyChart": [
      {
        "month": "2024-01",
        "count": 5,
        "value": 5000000
      }
    ],
    "comparison": {
      "export": [
        {
          "month": "2024-01",
          "count": 5,
          "value": 5000000
        }
      ],
      "import": [
        {
          "month": "2024-01",
          "count": 3,
          "value": 3000000
        }
      ]
    },
    "topExport": [
      {
        "month": "2024-01",
        "count": 5,
        "value": 5000000
      }
    ],
    "recentActivity": [
      {
        "id": "507f1f77bcf86cd799439011",
        "orderCode": "EO-2024-001",
        "contractCode": "CT-2024-001",
        "warehouseManager": "wm@example.com",
        "status": "completed",
        "totalValue": 1000000,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. GET /api/dashboard/stats
Lấy thống kê theo khoảng thời gian tùy chỉnh.

**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "exportOrders": {
      "totalOrders": 15,
      "totalValue": 15000000,
      "avgValue": 1000000
    },
    "importOrders": {
      "totalOrders": 8,
      "totalValue": 8000000,
      "avgValue": 1000000
    },
    "contracts": {
      "totalContracts": 12
    },
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.999Z"
    }
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No authentication token provided."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch dashboard data",
  "details": "Error details"
}
```

## Data Sources

### Overview Data
- **totalExportOrders**: Số lượng export orders trong tháng hiện tại
- **totalImportOrders**: Số lượng import orders trong tháng hiện tại  
- **totalContracts**: Số lượng contracts trong tháng hiện tại
- **totalValue**: Tổng giá trị export orders trong tháng hiện tại

### Monthly Chart Data
- Dữ liệu export orders theo tháng trong 12 tháng gần nhất
- Bao gồm số lượng và tổng giá trị

### Comparison Data
- So sánh export vs import orders theo tháng
- Dữ liệu trong 12 tháng gần nhất

### Top Export Data
- Top 10 tháng có nhiều export orders nhất
- Bao gồm số lượng và tổng giá trị

### Recent Activity
- 10 export orders gần nhất
- Bao gồm thông tin chi tiết về order, contract, warehouse manager

## Usage Examples

### Frontend Integration
```javascript
// Get dashboard data
const response = await fetch('/api/dashboard/representative', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();

// Get stats with date range
const statsResponse = await fetch('/api/dashboard/stats?startDate=2024-01-01&endDate=2024-12-31', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const stats = await statsResponse.json();
```

### cURL Examples
```bash
# Get representative dashboard
curl -X GET \
  http://localhost:3000/api/dashboard/representative \
  -H 'Authorization: Bearer <token>'

# Get stats with date range
curl -X GET \
  'http://localhost:3000/api/dashboard/stats?startDate=2024-01-01&endDate=2024-12-31' \
  -H 'Authorization: Bearer <token>'
```

## Notes
- Tất cả dữ liệu được lọc theo `created_by` của user đang đăng nhập
- Date ranges mặc định là tháng hiện tại nếu không được cung cấp
- Tất cả giá trị tiền tệ được trả về dưới dạng số nguyên (VND)
- Timestamps được trả về dưới dạng ISO 8601 format 