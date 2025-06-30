# HƯỚNG DẪN SỬ DỤNG CHỨC NĂNG QUẢN LÝ ĐƠN NHẬP KHO

## 1. Giới thiệu
Chức năng này cho phép các vai trò như Supervisor, Representative, Warehouse Manager quản lý toàn bộ quy trình nhập kho dược phẩm: tạo, duyệt, giao hàng, kiểm tra, sắp xếp, hoàn thành và hủy đơn nhập kho.

## 2. Vai trò & Quyền hạn
- **Supervisor:** Toàn quyền quản lý, chuyển trạng thái, gán/quản lý Warehouse Manager.
- **Representative:** Tạo và cập nhật đơn nhập kho (nếu được phân quyền).
- **Warehouse Manager:** Xem và xử lý các đơn được giao.

## 3. Các thao tác trên giao diện
### a. Xem danh sách đơn nhập kho
- Truy cập menu "Supervisor - Import Orders Management".
- Xem các thông tin: Mã đơn, mã hợp đồng, nhà cung cấp, người tạo, tổng tiền, trạng thái, warehouse manager...

### b. Thay đổi trạng thái đơn
- Nhấn vào chip trạng thái để chỉnh sửa trực tiếp (inline).
- Chọn trạng thái mới từ danh sách hợp lệ (theo luồng chuyển trạng thái).
- Trạng thái sẽ được cập nhật ngay khi chọn.

### c. Gán/quản lý Warehouse Manager
- Nhấn nút bút chì ở cột Actions để mở dialog gán warehouse manager.
- Chọn warehouse manager từ danh sách và nhấn "Assign".

### d. Xem chi tiết đơn
- Nhấn nút "i" ở cột Actions để xem chi tiết đơn nhập kho.

## 4. Luồng chuyển trạng thái
- **draft** → approved, cancelled
- **approved** → draft, delivered, cancelled
- **delivered** → approved, checked, cancelled
- **checked** → delivered, arranged, cancelled
- **arranged** → checked, completed, cancelled
- **completed**: không chuyển tiếp
- **cancelled**: không chuyển tiếp

> **Lưu ý:** Có thể chuyển ngược trạng thái (ví dụ: delivered → approved) theo quy định mới.

## 5. Một số lưu ý
- Chỉ supervisor mới có quyền gán warehouse manager.
- Các trường hợp không thể chuyển trạng thái sẽ báo lỗi rõ ràng.
- Sau mỗi thao tác, dữ liệu sẽ tự động cập nhật lại danh sách.

## 6. (Tùy chọn) Sử dụng API
- Xem chi tiết các endpoint trong tài liệu backend hoặc liên hệ dev backend để biết thêm.
- Một số endpoint chính:
  - `PATCH /import-orders/:id/status` — Cập nhật trạng thái đơn
  - `PATCH /import-orders/:id/assign-warehouse-manager` — Gán warehouse manager
  - `GET /import-orders` — Lấy danh sách đơn
  - `GET /import-orders/status-transitions` — Lấy luồng chuyển trạng thái

---
Nếu có thắc mắc hoặc lỗi, liên hệ team phát triển để được hỗ trợ thêm. 