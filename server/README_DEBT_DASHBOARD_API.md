# Debt Dashboard API Documentation

## Tổng quan

Debt Dashboard API cung cấp các endpoint để lấy dữ liệu thống kê cho Debt dashboard, bao gồm tổng quan công nợ, biểu đồ xu hướng, phân tích theo khách hàng và dữ liệu thu chi.

## Base URL

```
/api/dashboard/debt
```

## Authentication

Tất cả các endpoint đều yêu cầu authentication token trong header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. GET /api/dashboard/debt/overview

Lấy dữ liệu tổng quan về công nợ.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalDebt": 2450000,
    "overdueDebt": 890000,
    "paidAmount": 1560000,
    "upcomingDebt": 340000,
    "weeklyChange": {
      "totalDebt": 8.2,
      "overdueDebt": 12.5,
      "paidAmount": 15.3,
      "upcomingDebt": -5.1
    }
  }
}
```

### 2. GET /api/dashboard/debt/chart

Lấy dữ liệu biểu đồ xu hướng công nợ.

**Query Parameters:**

- `months` (optional): Số tháng muốn lấy dữ liệu (default: 12)

**Response:**

```json
{
  "success": true,
  "data": {
    "monthly": [
      {
        "month": "2024-01",
        "totalDebt": 2450,
        "overdue": 890,
        "paid": 1560
      }
    ],
    "quarterly": [
      {
        "quarter": "Q1",
        "totalDebt": 2450,
        "overdue": 890,
        "paid": 1560
      }
    ]
  }
}
```

### 3. GET /api/dashboard/debt/analysis

Lấy dữ liệu phân tích công nợ theo khách hàng.

**Query Parameters:**

- `period` (optional): 'monthly' hoặc 'quarterly' (default: 'monthly')

**Response:**

```json
{
  "success": true,
  "data": {
    "monthly": [
      {
        "title": "CT-2024-001",
        "value": "₫4,900,000",
        "progress": { "value": 75 },
        "type": "Supplier",
        "billCount": 2
      }
    ],
    "quarterly": [
      {
        "title": "CT-2024-001",
        "value": "₫14,700,000",
        "progress": { "value": 85 },
        "type": "Supplier",
        "billCount": 6
      }
    ]
  }
}
```

### 4. GET /api/dashboard/debt/receivable-payable

Lấy dữ liệu công nợ cần thu và cần thanh toán.

**Response:**

```json
{
  "success": true,
  "data": {
    "receivable": {
      "monthly": [1200, 1100, 1150, 1250, 1300, 1200, 1190, 1180, 1150, 1170, 1200, 1220],
      "quarterly": [3450, 3800, 3500, 3800],
      "total": 2800000
    },
    "payable": {
      "monthly": [900, 850, 870, 910, 930, 890, 860, 820, 800, 810, 830, 840],
      "quarterly": [2600, 2750, 2500, 2550],
      "total": 1800000
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
  "error": "Failed to fetch debt overview data",
  "details": "Error details"
}
```

## Data Sources

### Overview Data

- **totalDebt**: Tổng công nợ từ tất cả bills
- **overdueDebt**: Công nợ quá hạn (status: 'overdue')
- **paidAmount**: Tổng số tiền đã thanh toán
- **upcomingDebt**: Công nợ sắp đến hạn (status: 'pending')
- **weeklyChange**: Phần trăm thay đổi so với tuần trước

### Chart Data

- **monthly**: Dữ liệu theo tháng trong 12 tháng gần nhất
- **quarterly**: Dữ liệu theo quý
- **totalDebt**: Tổng công nợ
- **overdue**: Công nợ quá hạn
- **paid**: Số tiền đã thanh toán

### Analysis Data

- **title**: Tên khách hàng/đối tác (contract_code)
- **value**: Tổng giá trị công nợ
- **progress**: Phần trăm so với tổng công nợ hệ thống
- **type**: Loại đối tác (Supplier/Retailer)
- **billCount**: Số lượng bills

### Receivable/Payable Data

- **receivable**: Công nợ cần thu (từ export orders)
- **payable**: Công nợ cần thanh toán (từ import orders)
- **monthly**: Dữ liệu theo tháng
- **quarterly**: Dữ liệu theo quý
- **total**: Tổng giá trị

## Usage Examples

### Frontend Integration

```javascript
// Get debt overview
const response = await fetch('/api/dashboard/debt/overview', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Get chart data
const chartResponse = await fetch('/api/dashboard/debt/chart?months=12', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const chartData = await chartResponse.json();
```

### cURL Examples

```bash
# Get debt overview
curl -X GET \
  http://localhost:5000/api/dashboard/debt/overview \
  -H 'Authorization: Bearer <token>'

# Get chart data
curl -X GET \
  'http://localhost:5000/api/dashboard/debt/chart?months=12' \
  -H 'Authorization: Bearer <token>'

# Get analysis data
curl -X GET \
  'http://localhost:5000/api/dashboard/debt/analysis?period=monthly' \
  -H 'Authorization: Bearer <token>'
```

## Seeding Data

Để test API với dữ liệu mẫu, chạy script seeding:

```bash
cd server
node src/scripts/seed-debt-data.js
```

Script này sẽ tạo:

- 3 medicines mẫu
- 3 users mẫu (supervisor, representative, warehouse_manager)
- 2 contracts mẫu (supplier và retailer)
- 2 import orders mẫu
- 2 export orders mẫu
- 5 bills mẫu với các trạng thái khác nhau

## Notes

- Tất cả dữ liệu được tính toán từ Bill model
- Import orders tạo ra payable (công nợ cần thanh toán)
- Export orders tạo ra receivable (công nợ cần thu)
- Payment vouchers được tính vào paid amount
- Tất cả giá trị tiền tệ được trả về dưới dạng số nguyên (VND)
- Timestamps được trả về dưới dạng ISO 8601 format
