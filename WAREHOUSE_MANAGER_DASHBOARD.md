# Warehouse Manager Dashboard

## Tổng quan

Warehouse Manager Dashboard là một giao diện quản lý tổng quan dành cho Warehouse Manager, cung cấp các thông tin quan trọng về:

- Tổng số lượng hàng tồn kho
- Đơn hàng nhập/xuất đang chờ xử lý
- Đơn hàng đã hoàn thành
- Sản phẩm sắp hết hàng
- Tổng giá trị hàng tồn kho

## Tính năng chính

### 1. Thống kê tổng quan (Statistics Cards)
- **Total Inventory Items**: Tổng số sản phẩm trong kho
- **Pending Import Orders**: Đơn hàng nhập đang chờ xử lý
- **Pending Export Orders**: Đơn hàng xuất đang chờ xử lý
- **Completed Orders**: Đơn hàng đã hoàn thành trong tháng
- **Low Stock Items**: Sản phẩm sắp hết hàng
- **Total Inventory Value**: Tổng giá trị hàng tồn kho (VND)

### 2. Bảng đơn hàng gần đây
- **Recent Import Orders**: 5 đơn hàng nhập gần nhất
- **Recent Export Orders**: 5 đơn hàng xuất gần nhất
- Hiển thị: Order ID, Status, Created Date, Actions

### 3. Bảng sản phẩm sắp hết hàng
- Danh sách 5 sản phẩm có số lượng thấp nhất
- Hiển thị: Tên thuốc, Số lượng hiện tại, Số lượng tối thiểu, Trạng thái

## Cấu trúc file

```
client/src/app/(warehouse_manager)/
├── wm-dashboard/
│   └── page.js                    # Route page cho dashboard
└── layout.jsx                     # Layout cho warehouse manager

client/src/views/warehouse-manager/
└── dashboard.jsx                  # Component chính của dashboard

client/src/menu/
└── warehouse-manager.jsx          # Menu configuration

server/src/services/
└── dashboardService.js            # Service cho dashboard data

server/src/controllers/
└── dashboardController.js         # Controller cho dashboard API

server/src/routes/
└── dashboardRoute.js              # API routes
```

## API Endpoints

### GET /api/dashboard/warehouse-manager
Trả về dữ liệu dashboard cho warehouse manager:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalInventory": 150,
      "pendingImportOrders": 5,
      "pendingExportOrders": 3,
      "completedOrders": 25,
      "lowStockItems": 8,
      "totalValue": 15000000
    },
    "recentImportOrders": [...],
    "recentExportOrders": [...],
    "lowStockMedicines": [...]
  }
}
```

## Cách sử dụng

1. **Truy cập dashboard**: Đăng nhập với tài khoản Warehouse Manager
2. **Xem thống kê**: Dashboard hiển thị các thống kê quan trọng
3. **Theo dõi đơn hàng**: Xem danh sách đơn hàng gần đây
4. **Quản lý tồn kho**: Theo dõi sản phẩm sắp hết hàng

## Tính năng bổ sung

- **Responsive Design**: Tương thích với mobile và desktop
- **Real-time Data**: Dữ liệu được cập nhật theo thời gian thực
- **Error Handling**: Xử lý lỗi và hiển thị thông báo phù hợp
- **Loading States**: Hiển thị trạng thái loading khi tải dữ liệu

## Cập nhật và bảo trì

- Dashboard tự động cập nhật dữ liệu khi component mount
- Có thể thêm tính năng refresh manual
- Dễ dàng mở rộng thêm các thống kê mới 