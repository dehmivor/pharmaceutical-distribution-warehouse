# Warehouse Manager Chart Demo

## Tính năng Chart mới

### 1. Orders Trend Chart
- **Biểu đồ đường**: Hiển thị xu hướng đơn hàng nhập/xuất trong 6 tháng gần nhất
- **Toggle View**: Chuyển đổi giữa:
  - **Count**: Số lượng đơn hàng
  - **Value**: Giá trị đơn hàng (VND)

### 2. Dữ liệu Chart
```javascript
// Dữ liệu mẫu cho chart
const chartData = {
  labels: ["1/2024", "2/2024", "3/2024", "4/2024", "5/2024", "6/2024"],
  datasets: [
    {
      label: 'Import Orders',
      data: [10, 15, 12, 18, 20, 16],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      label: 'Export Orders',
      data: [8, 12, 10, 15, 18, 14],
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)'
    }
  ],
  valueDatasets: [
    {
      label: 'Import Value (VND)',
      data: [5000000, 7500000, 6000000, 9000000, 10000000, 8000000],
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)'
    },
    {
      label: 'Export Value (VND)',
      data: [4000000, 6000000, 5000000, 7500000, 9000000, 7000000],
      borderColor: '#9C27B0',
      backgroundColor: 'rgba(156, 39, 176, 0.1)'
    }
  ]
};
```

### 3. Tính năng Chart
- **Responsive**: Tự động điều chỉnh kích thước
- **Interactive**: Hover để xem chi tiết
- **Color-coded**: Màu sắc khác nhau cho từng loại dữ liệu
- **Area fill**: Vùng tô màu nhẹ để dễ nhìn
- **Legend**: Chú thích màu sắc ở dưới chart

### 4. API Integration
- **Backend**: `getWarehouseManagerChartData()` method trong `dashboardService.js`
- **Frontend**: `WarehouseManagerChart` component
- **Data Flow**: API → Dashboard → Chart Component

### 5. Cách sử dụng
1. Truy cập Warehouse Manager Dashboard
2. Scroll xuống phần "Orders Trend Chart"
3. Sử dụng toggle buttons để chuyển đổi view
4. Hover vào chart để xem chi tiết

### 6. Cấu trúc Component
```jsx
<WarehouseManagerChart 
  chartData={dashboardData.chartData} 
/>
```

### 7. Styling
- **Card Layout**: Chart được bọc trong Card component
- **Typography**: Sử dụng Material-UI typography
- **Colors**: Consistent với theme của ứng dụng
- **Spacing**: Proper spacing và margins

### 8. Error Handling
- **No Data**: Hiển thị placeholder khi không có dữ liệu
- **Loading**: Chart sẽ hiển thị loading state
- **Fallback**: Graceful degradation khi chart không load được 