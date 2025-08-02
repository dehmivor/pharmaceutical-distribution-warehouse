# Supervisor Dashboard Documentation

## Tổng quan

Supervisor Dashboard cung cấp giao diện quản lý tổng quan cho vai trò Supervisor trong hệ thống quản lý kho dược phẩm.

## Tính năng chính

### 1. Analytics Overview Cards
- **KPI Cards**: Hiển thị các chỉ số quan trọng
- **Real-time Data**: Dữ liệu được cập nhật theo thời gian thực
- **Visual Indicators**: Biểu đồ và màu sắc để dễ dàng theo dõi

### 2. Analytics Overview Chart
- **Line Chart**: Biểu đồ đường hiển thị xu hướng
- **Multiple Data Series**: Nhiều loại dữ liệu trên cùng một biểu đồ
- **Interactive**: Tương tác với biểu đồ để xem chi tiết
- **Time Filters**: Lọc theo ngày, tháng, năm

### 3. Analytics Top Referrers
- **Data Tables**: Bảng dữ liệu chi tiết
- **Multiple Tabs**: Chuyển đổi giữa các loại dữ liệu khác nhau
- **Progress Indicators**: Hiển thị tiến độ và tỷ lệ
- **Responsive Design**: Tương thích với nhiều kích thước màn hình

### 4. Recent Activity (Mới)
- **Activity Feed**: Hiển thị các hoạt động gần đây
- **Multiple Activity Types**: Import orders, Export orders, Inventory checks, User activities
- **Status Indicators**: Chip hiển thị trạng thái với màu sắc
- **Time Stamps**: Thời gian tương đối (2h ago, 1d ago)
- **Value Display**: Hiển thị giá trị cho các đơn hàng
- **Refresh Function**: Nút refresh để cập nhật dữ liệu

## Cấu trúc file

### Frontend
```
client/src/
├── app/(supervisor)/dashboard/
│   └── page.js                          # Next.js page component
├── views/admin/
│   └── dashboard.jsx                    # Main dashboard component
└── sections/dashboard/
    ├── AnalyticsOverviewCard.jsx        # KPI cards component
    ├── AnalyticsOverviewChart.jsx       # Main chart component
    ├── AnalyticsTopRef.jsx              # Data tables component
    └── SupervisorRecentActivity.jsx     # Recent activity component (Mới)
```

### Backend
```
server/src/
├── routes/
│   └── dashboardRoute.js                # API routes
├── controllers/
│   └── dashboardController.js           # Request handlers
└── services/
    └── dashboardService.js              # Business logic
```

## API Endpoints

### 1. Supervisor Recent Activity
**URL:** `GET /api/dashboard/supervisor/recent-activity`

**Query Parameters:**
- `limit` (optional): Số lượng hoạt động trả về (default: 10)

**Response Format:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": "order_id",
      "type": "import|export",
      "title": "Import Order ABC123",
      "description": "Contract: CON-001 | Created by user@example.com",
      "status": "completed|pending|approved|draft",
      "timestamp": "2025-01-15T10:30:00Z",
      "value": 5000000,
      "contractCode": "CON-001",
      "orderCode": "ABC123"
    }
  ]
}
```

## Tính năng Recent Activity

### Loại hoạt động được hiển thị:
1. **Import Orders**: Đơn hàng nhập kho
2. **Export Orders**: Đơn hàng xuất kho
3. **Inventory Checks**: Kiểm tra tồn kho (sẽ thêm sau)
4. **User Activities**: Hoạt động người dùng (sẽ thêm sau)

### Status Chips:
- **Completed**: Xanh lá (✅)
- **Pending**: Vàng (⏳)
- **Approved**: Xanh dương (✅)
- **Draft**: Xám (⏳)
- **Delivered**: Xanh dương (✅)
- **Error**: Đỏ (❌)

### Time Format:
- **Just now**: Dưới 1 giờ
- **2h ago**: 2 giờ trước
- **1d ago**: 1 ngày trước

### Icons:
- **Import**: FileImport icon (Xanh dương)
- **Export**: FileExport icon (Tím)
- **Inventory**: Inventory icon (Xanh dương nhạt)
- **User**: Person icon (Xanh lá)

## Layout

Dashboard sử dụng Grid layout với responsive design:

```jsx
<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid size={12}>
    <AnalyticsOverviewCard />        // KPI Cards - Full width
  </Grid>
  <Grid size={12}>
    <AnalyticsOverviewChart />       // Main Chart - Full width
  </Grid>
  <Grid size={12} md={8}>
    <AnalyticsTopRef />              // Data Tables - 8/12 width
  </Grid>
  <Grid size={12} md={4}>
    <SupervisorRecentActivity />     // Recent Activity - 4/12 width
  </Grid>
</Grid>
```

## Error Handling

### Frontend:
- **Loading State**: Hiển thị CircularProgress khi đang tải
- **Error State**: Hiển thị Alert với thông báo lỗi
- **Fallback Data**: Hiển thị dữ liệu demo khi API lỗi
- **Retry Function**: Nút refresh để thử lại

### Backend:
- **Authentication**: Kiểm tra token trước khi xử lý
- **Error Logging**: Log lỗi chi tiết
- **Graceful Degradation**: Trả về lỗi có cấu trúc
- **Data Validation**: Kiểm tra dữ liệu đầu vào

## Performance

### Frontend:
- **Lazy Loading**: Components được load khi cần
- **Memoization**: Tránh re-render không cần thiết
- **Optimized API Calls**: Gọi API hiệu quả

### Backend:
- **Database Indexing**: Index cho các trường thường query
- **Aggregation Pipeline**: Sử dụng MongoDB aggregation
- **Pagination**: Giới hạn số lượng kết quả trả về

## Security

- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Input Validation**: Sanitize user input
- **CORS**: Cross-origin resource sharing configuration

## Future Enhancements

1. **Real-time Updates**: WebSocket cho cập nhật real-time
2. **Export Functionality**: Xuất báo cáo PDF/Excel
3. **Advanced Filtering**: Bộ lọc nâng cao cho dữ liệu
4. **Customizable Dashboard**: Cho phép tùy chỉnh layout
5. **Notification System**: Thông báo cho các sự kiện quan trọng
6. **Mobile Optimization**: Tối ưu cho thiết bị di động 