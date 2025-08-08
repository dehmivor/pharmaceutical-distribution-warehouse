# Report API Documentation

## Tổng quan

Report API cung cấp các endpoint để tạo báo cáo thống kê toàn diện cho supervisor, bao gồm báo cáo tổng hợp, báo cáo theo thời gian, phân tích theo đối tác và thuốc, với khả năng xuất Excel và upload file.

## Base URL

```
/api/reports
```

## Authentication

Tất cả các endpoint đều yêu cầu authentication token trong header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. GET /api/reports/comprehensive

Lấy báo cáo tổng hợp với đầy đủ thông tin bills.

**Query Parameters:**

- `startDate` (optional): Ngày bắt đầu (ISO format)
- `endDate` (optional): Ngày kết thúc (ISO format)
- `period` (optional): Chu kỳ (weekly/monthly/quarterly)
- `status` (optional): Trạng thái bill (pending/completed/overdue)
- `type` (optional): Loại bill (IMPORT/EXPORT/PAYMENT_VOUCHER)
- `partnerType` (optional): Loại đối tác (Supplier/Retailer)

**Response:**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "bill_id",
        "billCode": "BILL-001",
        "voucherCode": "PV-001",
        "contractCode": "CT-2024-001",
        "partnerType": "Supplier",
        "partnerId": "partner_id",
        "orderCode": "ORDER-001",
        "orderType": "IMPORT",
        "billType": "IMPORT",
        "status": "pending",
        "totalValue": 2450000,
        "amountPaid": 0,
        "remainingAmount": 2450000,
        "paymentDate": "2024-01-15T00:00:00.000Z",
        "dueDate": "2024-02-15T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "details": [
          {
            "medicineCode": "MED001",
            "quantity": 500,
            "unitPrice": 5000,
            "totalPrice": 2500000
          }
        ]
      }
    ],
    "summary": {
      "totalBills": 10,
      "totalValue": 24500000,
      "totalPaid": 15600000,
      "totalRemaining": 8900000,
      "overdueBills": 2,
      "pendingBills": 5,
      "completedBills": 3,
      "importBills": 6,
      "exportBills": 4
    },
    "filters": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-12-31T23:59:59.999Z",
      "period": "monthly",
      "status": "pending",
      "type": "IMPORT",
      "partnerType": "Supplier"
    }
  }
}
```

### 2. GET /api/reports/period

Lấy báo cáo theo thời gian (tuần/tháng/quý).

**Query Parameters:**

- `startDate` (required): Ngày bắt đầu (ISO format)
- `endDate` (required): Ngày kết thúc (ISO format)
- `period` (optional): Chu kỳ (weekly/monthly/quarterly, default: monthly)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "period": "2024-01",
      "totalBills": 15,
      "totalValue": 3500000,
      "totalPaid": 2800000,
      "totalRemaining": 700000,
      "overdueBills": 2,
      "pendingBills": 8,
      "completedBills": 5
    }
  ]
}
```

### 3. GET /api/reports/partner-analysis

Phân tích báo cáo theo đối tác.

**Query Parameters:**

- `startDate` (required): Ngày bắt đầu (ISO format)
- `endDate` (required): Ngày kết thúc (ISO format)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "contractCode": "CT-2024-001",
      "partnerType": "Supplier",
      "partnerId": "supplier_001",
      "totalBills": 5,
      "totalValue": 12000000,
      "totalPaid": 8000000,
      "totalRemaining": 4000000,
      "overdueBills": 1,
      "pendingBills": 3,
      "completedBills": 1
    }
  ]
}
```

### 4. GET /api/reports/medicine-analysis

Phân tích báo cáo theo thuốc.

**Query Parameters:**

- `startDate` (required): Ngày bắt đầu (ISO format)
- `endDate` (required): Ngày kết thúc (ISO format)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "medicineCode": "MED001",
      "totalQuantity": 1500,
      "totalValue": 7500000,
      "averagePrice": 5000,
      "billCount": 8
    }
  ]
}
```

### 5. GET /api/reports/export

Xuất báo cáo ra file Excel.

**Query Parameters:**

- `startDate` (optional): Ngày bắt đầu (ISO format)
- `endDate` (optional): Ngày kết thúc (ISO format)
- `period` (optional): Chu kỳ (weekly/monthly/quarterly)
- `status` (optional): Trạng thái bill
- `type` (optional): Loại bill
- `partnerType` (optional): Loại đối tác
- `reportType` (optional): Loại báo cáo (comprehensive/period/partner/medicine, default: comprehensive)

**Response:** File Excel được download

### 6. POST /api/reports/upload

Upload file Excel để xử lý.

**Request:**

- Content-Type: multipart/form-data
- Body: file (Excel file)

**Response:**

```json
{
  "success": true,
  "message": "File uploaded and processed successfully",
  "data": {
    "filename": "report.xlsx",
    "rows": 100,
    "data": [
      // First 10 rows for preview
    ]
  }
}
```

### 7. GET /api/reports/templates

Lấy danh sách template báo cáo.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "comprehensive",
      "name": "Báo cáo tổng hợp",
      "description": "Báo cáo chi tiết tất cả bills với đầy đủ thông tin",
      "fields": [
        "billCode",
        "contractCode",
        "partnerType",
        "orderType",
        "status",
        "totalValue",
        "amountPaid",
        "remainingAmount"
      ]
    },
    {
      "id": "period",
      "name": "Báo cáo theo thời gian",
      "description": "Báo cáo thống kê theo tuần/tháng/quý",
      "fields": [
        "period",
        "totalBills",
        "totalValue",
        "totalPaid",
        "totalRemaining",
        "overdueBills",
        "pendingBills",
        "completedBills"
      ]
    },
    {
      "id": "partner",
      "name": "Báo cáo theo đối tác",
      "description": "Phân tích công nợ theo từng đối tác",
      "fields": [
        "contractCode",
        "partnerType",
        "partnerId",
        "totalBills",
        "totalValue",
        "totalPaid",
        "totalRemaining"
      ]
    },
    {
      "id": "medicine",
      "name": "Báo cáo theo thuốc",
      "description": "Phân tích theo từng loại thuốc",
      "fields": ["medicineCode", "totalQuantity", "totalValue", "averagePrice", "billCount"]
    }
  ]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Start date and end date are required"
}
```

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
  "error": "Failed to generate comprehensive report",
  "details": "Error details"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Get comprehensive report
const response = await fetch('/api/reports/comprehensive?startDate=2024-01-01&endDate=2024-12-31', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Export to Excel
const exportResponse = await fetch(
  '/api/reports/export?reportType=comprehensive&startDate=2024-01-01&endDate=2024-12-31',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const blob = await exportResponse.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'report.xlsx';
link.click();
```

### cURL Examples

```bash
# Get comprehensive report
curl -X GET \
  'http://localhost:5000/api/reports/comprehensive?startDate=2024-01-01&endDate=2024-12-31' \
  -H 'Authorization: Bearer <token>'

# Export to Excel
curl -X GET \
  'http://localhost:5000/api/reports/export?reportType=comprehensive&startDate=2024-01-01&endDate=2024-12-31' \
  -H 'Authorization: Bearer <token>' \
  --output report.xlsx

# Upload file
curl -X POST \
  'http://localhost:5000/api/reports/upload' \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@report.xlsx'
```

## Data Sources

### Comprehensive Report

- **bills**: Danh sách tất cả bills với thông tin chi tiết
- **summary**: Thống kê tổng quan
- **filters**: Bộ lọc đã áp dụng

### Period Report

- **period**: Chu kỳ thời gian
- **totalBills**: Tổng số bills
- **totalValue**: Tổng giá trị
- **totalPaid**: Tổng đã thanh toán
- **totalRemaining**: Tổng còn lại
- **overdueBills**: Số bills quá hạn
- **pendingBills**: Số bills chờ xử lý
- **completedBills**: Số bills hoàn thành

### Partner Analysis

- **contractCode**: Mã hợp đồng
- **partnerType**: Loại đối tác
- **partnerId**: ID đối tác
- **totalBills**: Tổng số bills
- **totalValue**: Tổng giá trị
- **totalPaid**: Tổng đã thanh toán
- **totalRemaining**: Tổng còn lại

### Medicine Analysis

- **medicineCode**: Mã thuốc
- **totalQuantity**: Tổng số lượng
- **totalValue**: Tổng giá trị
- **averagePrice**: Giá trung bình
- **billCount**: Số lượng bills

## Notes

- Tất cả dữ liệu được tính toán từ Bill model
- Import orders tạo ra bills loại IMPORT
- Export orders tạo ra bills loại EXPORT
- Payment vouchers tạo ra bills loại PAYMENT_VOUCHER
- Tất cả giá trị tiền tệ được trả về dưới dạng số nguyên (VND)
- Timestamps được trả về dưới dạng ISO 8601 format
- File upload hỗ trợ định dạng .xlsx, .xls, .csv
- Kích thước file upload tối đa: 5MB
