# Report Test Data Setup

## Tổng quan

Hướng dẫn setup dữ liệu test cho Report API và màn hình báo cáo.

## 📋 Yêu cầu hệ thống

- Node.js (v14+)
- MongoDB (v4.4+)
- NPM hoặc Yarn

## 🚀 Cách chạy

### 1. Cài đặt dependencies

```bash
cd server
npm install
```

### 2. Cấu hình database

Đảm bảo MongoDB đang chạy và có thể kết nối được.

### 3. Chạy script setup dữ liệu test

```bash
# Chạy script tổng hợp (khuyến nghị)
node src/scripts/setup-report-test.js

# Hoặc chạy từng script riêng lẻ
node src/scripts/clear-report-data.js
node src/scripts/seed-report-data.js
```

## 📊 Dữ liệu test được tạo

### 👥 Users (3 accounts)

- **Supervisor**: `supervisor@example.com` / `password123`
- **Representative**: `representative@example.com` / `password123`
- **Warehouse Manager**: `warehouse_manager@example.com` / `password123`

### 💊 Medicines (5 loại)

- **MED001**: Paracetamol 500mg (thuốc không kê đơn)
- **MED002**: Ibuprofen 400mg (thuốc không kê đơn)
- **MED003**: Amoxicillin 500mg (Thuốc kháng sinh)
- **MED004**: Omeprazole 20mg (thuốc kê đơn)
- **MED005**: Cetirizine 10mg (thuốc không kê đơn)

### 📋 Contracts (4 hợp đồng)

- **CT-2024-001**: Supplier contract (Paracetamol, Ibuprofen)
- **CT-2024-002**: Retailer contract (Paracetamol, Amoxicillin)
- **CT-2024-003**: Supplier contract (Omeprazole, Cetirizine)
- **CT-2024-004**: Retailer contract (Ibuprofen, Cetirizine)

### 📦 Orders (8 đơn hàng)

- **4 Import Orders**: 3 completed, 1 pending
- **4 Export Orders**: 3 completed, 1 pending

### 💰 Bills (14 bills)

- **10 Completed bills**: Đã thanh toán
- **2 Pending bills**: Chờ thanh toán
- **2 Overdue bills**: Quá hạn thanh toán

## 📈 Thống kê dữ liệu

### Bills theo trạng thái:

- **Total Bills**: 14
- **Completed**: 10
- **Pending**: 2
- **Overdue**: 2

### Bills theo loại:

- **Import Bills**: 6
- **Export Bills**: 6
- **Payment Vouchers**: 2

### Bills theo thời gian:

- **Tháng 1**: 3 bills
- **Tháng 2**: 6 bills
- **Tháng 3**: 5 bills

## 🎯 Tính năng test

### Báo cáo tổng hợp

- Hiển thị tất cả 14 bills với đầy đủ thông tin
- Thống kê theo trạng thái, loại, thời gian
- Bộ lọc theo nhiều tiêu chí

### Báo cáo theo thời gian

- Dữ liệu theo tuần/tháng/quý
- Thống kê xu hướng theo thời gian

### Phân tích theo đối tác

- 4 contracts với 2 loại đối tác (Supplier/Retailer)
- Thống kê theo từng đối tác

### Phân tích theo thuốc

- 5 loại thuốc với các danh mục khác nhau
- Thống kê số lượng, giá trị, giá trung bình

## 🔧 Test API

### 1. Đăng nhập để lấy token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@example.com",
    "password": "password123"
  }'
```

### 2. Test các API endpoints

```bash
# Lấy báo cáo tổng hợp
curl -X GET "http://localhost:5000/api/reports/comprehensive" \
  -H "Authorization: Bearer <token>"

# Lấy báo cáo theo thời gian
curl -X GET "http://localhost:5000/api/reports/period?startDate=2024-01-01&endDate=2024-03-31&period=monthly" \
  -H "Authorization: Bearer <token>"

# Lấy phân tích theo đối tác
curl -X GET "http://localhost:5000/api/reports/partner-analysis?startDate=2024-01-01&endDate=2024-03-31" \
  -H "Authorization: Bearer <token>"

# Lấy phân tích theo thuốc
curl -X GET "http://localhost:5000/api/reports/medicine-analysis?startDate=2024-01-01&endDate=2024-03-31" \
  -H "Authorization: Bearer <token>"

# Xuất Excel
curl -X GET "http://localhost:5000/api/reports/export?reportType=comprehensive&startDate=2024-01-01&endDate=2024-03-31" \
  -H "Authorization: Bearer <token>" \
  --output report.xlsx
```

## 🎨 Test Frontend

### 1. Chạy client

```bash
cd client
npm install
npm run dev
```

### 2. Đăng nhập

- Truy cập: `http://localhost:3000`
- Đăng nhập với: `supervisor@example.com` / `password123`

### 3. Test màn hình Report

- Vào màn hình Report
- Test các bộ lọc (từ ngày, đến ngày, trạng thái, loại)
- Test các tabs (tổng hợp, theo thời gian, theo đối tác, theo thuốc)
- Test chức năng tải về Excel
- Test chức năng upload file

## 🧹 Xóa dữ liệu test

Nếu muốn xóa dữ liệu test:

```bash
node src/scripts/clear-report-data.js
```

## 📝 Lưu ý

1. **Dữ liệu test**: Chỉ dùng cho mục đích test, không dùng cho production
2. **MongoDB**: Đảm bảo MongoDB đang chạy trước khi chạy script
3. **Environment**: Có thể cấu hình MONGODB_URI trong file .env
4. **Backup**: Nên backup database trước khi chạy script nếu có dữ liệu quan trọng

## 🔍 Troubleshooting

### Lỗi kết nối MongoDB

```bash
# Kiểm tra MongoDB có đang chạy không
mongosh
# hoặc
mongo
```

### Lỗi permission

```bash
# Đảm bảo có quyền write vào thư mục
chmod 755 src/scripts/
```

### Lỗi dependencies

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

1. MongoDB connection
2. Node.js version
3. Dependencies installation
4. File permissions
5. Network connectivity
