# Currency Conversion Fixes for Stripe Integration

## Vấn đề đã được sửa

### 1. **Tổng tiền thanh toán sai**

- **Nguyên nhân**: Logic tính tổng tiền trong `getBillsTotalAmount` không chính xác
- **Giải pháp**: Cải thiện logging và đảm bảo tính toán chính xác tổng tiền VND

### 2. **Data từ Stripe trả về sai đơn vị**

- **Nguyên nhân**: Stripe trả về amount theo cents USD, nhưng code convert sai cách
- **Giải pháp**: Tạo utility `currencyConverter.js` để xử lý nhất quán

## Các thay đổi chính

### Backend (Server)

#### 1. **Tạo utility mới**: `server/src/utils/currencyConverter.js`

```javascript
// Chuyển đổi VND → USD Cents (cho Stripe)
const convertVNDToUSDCents = (amountVND) => { ... }

// Chuyển đổi USD Cents → VND (từ Stripe webhook)
const convertUSDCentsToVND = (amountCents) => { ... }

// Validation số tiền tối thiểu
const validateMinimumPayment = (amountVND) => { ... }
```

#### 2. **Cập nhật `stripeService.js`**

- Sử dụng utility mới thay vì hardcode conversion
- Đảm bảo nhất quán trong tất cả các hàm
- Cải thiện logging để debug

#### 3. **Cập nhật `stripeController.js`**

- Cải thiện logging trong `getBillsTotalAmount`
- Đảm bảo trả về đúng đơn vị VND

### Frontend (Client)

#### 1. **Sửa `calcAmountPaid`**

- Loại bỏ logic convert sai (không chia cho 100 nữa)
- `amountPaid` trong DB đã là VND

#### 2. **Cải thiện validation**

- Thêm validation số tiền âm
- Cải thiện logic tính tổng tiền thanh toán nhiều hóa đơn

#### 3. **Cải thiện logging**

- Thêm logging chi tiết cho việc tính toán tổng tiền
- Đảm bảo đơn vị tiền tệ rõ ràng

## Luồng xử lý tiền tệ

### 1. **Frontend → Backend**

```
User nhập: 300,000 VND
Frontend gửi: 300000 (số nguyên VND)
Backend nhận: 300000 VND
```

### 2. **Backend → Stripe**

```
Backend: 300000 VND
Utility convert: 300000 / 25000 = 12 USD
Stripe nhận: 1200 cents (12 * 100)
```

### 3. **Stripe → Backend (Webhook)**

```
Stripe trả về: 1200 cents
Utility convert: 1200 / 100 * 25000 = 300000 VND
Backend lưu DB: 300000 VND
```

### 4. **Backend → Frontend**

```
DB lưu: 300000 VND
Frontend nhận: 300000 VND
Frontend hiển thị: 300,000 VND
```

## Kiểm tra sau khi sửa

### 1. **Test thanh toán đơn lẻ**

- Tạo hóa đơn 300,000 VND
- Thanh toán qua Stripe
- Kiểm tra webhook nhận đúng 300,000 VND
- Kiểm tra DB lưu đúng 300,000 VND

### 2. **Test thanh toán nhiều hóa đơn**

- Chọn 2 hóa đơn: 200,000 VND + 100,000 VND
- Tổng: 300,000 VND
- Kiểm tra Stripe nhận đúng 300,000 VND
- Kiểm tra webhook xử lý đúng từng hóa đơn

### 3. **Test validation**

- Kiểm tra số tiền âm
- Kiểm tra số tiền vượt quá số tiền còn lại
- Kiểm tra số tiền tối thiểu (1,250 VND = 50 cents)

## Lưu ý quan trọng

1. **Tỷ giá cố định**: Hiện tại sử dụng 1 USD = 25,000 VND
2. **Stripe minimum**: 50 cents = 1,250 VND
3. **Đơn vị DB**: Luôn lưu theo VND
4. **Frontend display**: Luôn hiển thị theo VND với format phù hợp

## Các file đã thay đổi

- `server/src/utils/currencyConverter.js` (mới)
- `server/src/services/stripeService.js`
- `server/src/controllers/stripeController.js`
- `client/src/views/supervisor/manage-bills.jsx`
- `CURRENCY_FIX_README.md` (mới)
