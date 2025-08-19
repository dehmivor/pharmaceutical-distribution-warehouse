# QR Scanner for Supervisor Profile

## Tổng quan

Đã thêm chức năng scan QR code vào Profile của supervisor để thực hiện chức năng scan mobile mode. Chức năng này cho phép supervisor quét mã QR và nhận về chuỗi dữ liệu.

## Các thành phần đã thêm

### 1. QRScanner Component (`src/components/QRScanner.jsx`)

- Component chính để quét mã QR
- Sử dụng thư viện @zxing/library để quét QR code
- Hỗ trợ chọn camera (nếu có nhiều camera)
- Giao diện responsive và thân thiện với mobile
- Xử lý lỗi và hiển thị thông báo

### 2. Cập nhật Profile Supervisor (`src/layouts/SupervisorLayout/Header/HeaderContent/Profile.jsx`)

- Thay thế item "RTL Mode" bằng "Scan Mobile Mode"
- Thêm icon QR code
- Tích hợp QRScanner component
- Xử lý dữ liệu QR code nhận được

### 3. QR Code Generator (`src/components/QRCodeGenerator.jsx`)

- Component để tạo QR code demo
- Sử dụng Google Charts API
- Hỗ trợ test chức năng scan

### 4. Trang Demo (`src/app/(supervisor)/qr-scanner-demo/page.jsx`)

- Trang demo để test chức năng QR scanner
- Hiển thị dữ liệu đã quét
- Tích hợp cả scanner và generator

## Cách sử dụng

### 1. Sử dụng trong Profile

1. Click vào avatar/profile của supervisor
2. Click vào "Scan Mobile Mode" trong menu dropdown
3. Chọn camera (nếu có nhiều camera)
4. Click "Start Scan" để bắt đầu quét
5. Đưa mã QR vào khung quét
6. Dữ liệu sẽ được xử lý và hiển thị thông báo

### 2. Test chức năng

1. Truy cập `/qr-scanner-demo` để test
2. Sử dụng QR Code Generator để tạo mã QR test
3. Sử dụng QR Scanner để quét mã QR đã tạo

## Thư viện đã cài đặt

- `@zxing/library`: Thư viện chính để quét QR code
- `@zxing/browser`: Hỗ trợ browser APIs
- `react-qr-reader`: (Đã thay thế bằng @zxing)

## Tính năng

- ✅ Quét mã QR từ camera
- ✅ Hỗ trợ nhiều camera
- ✅ Giao diện responsive
- ✅ Xử lý lỗi
- ✅ Hiển thị thông báo
- ✅ Tích hợp vào Profile supervisor
- ✅ Hỗ trợ mobile mode

## Xử lý dữ liệu

Khi quét thành công, dữ liệu QR code sẽ được:

1. Hiển thị thông báo thành công
2. Log vào console để debug
3. Xử lý theo logic tùy chỉnh (có thể thêm API call, lưu state, v.v.)
4. Hỗ trợ cả dữ liệu JSON và string

## Lưu ý

- Cần cấp quyền camera khi sử dụng
- Hoạt động tốt nhất trên HTTPS (do yêu cầu camera API)
- Hỗ trợ các trình duyệt hiện đại
- Responsive design cho mobile và desktop

## Tùy chỉnh

Bạn có thể tùy chỉnh:

- Logic xử lý dữ liệu QR code trong `handleQRScan` function
- Giao diện của QRScanner component
- Thêm validation cho dữ liệu QR code
- Tích hợp với API backend
- Thêm logging và analytics
