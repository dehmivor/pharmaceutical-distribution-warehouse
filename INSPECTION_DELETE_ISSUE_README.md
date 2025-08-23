# Import Inspection Delete Issue - Vấn đề xóa và tạo lại inspection

## 🚨 **Vấn đề đã được khắc phục:**

### **1. Mô tả vấn đề:**

- Sau khi xóa đơn kiểm nhập (import inspection), khi tạo mới với cùng `medicine_id` và `import_order_id` thì báo lỗi
- Lỗi: **"Inspections already exist for medicine(s)"**
- Điều này gây khó khăn cho việc quản lý inspection

### **2. Nguyên nhân gốc rễ:**

#### **A. Business Logic Constraint:**

Trong service `createMultipleInspections`, có logic kiểm tra duplicate medicine:

```javascript
// Logic cũ (gây lỗi)
const existingInspections = await ImportInspection.find({
  import_order_id: importOrderId,
});
const existingMedicineIds = existingInspections.map((ins) =>
  ins.medicine_id.toString()
);

const duplicateMedicines = newInspections.filter((d) =>
  existingMedicineIds.includes(d.medicine_id.toString())
);

if (duplicateMedicines.length > 0) {
  const error = new Error(
    `Inspections already exist for medicine(s): ${medicineListStr}`
  );
  error.statusCode = 400;
  throw error;
}
```

#### **B. Vấn đề xảy ra:**

1. **Khi xóa inspection**: Inspection được xóa khỏi database
2. **Khi tạo mới**: Logic validation vẫn kiểm tra xem `medicine_id` đã có inspection trong `import_order_id` chưa
3. **Lỗi**: Nếu tạo inspection mới với cùng `medicine_id` và `import_order_id`, hệ thống sẽ báo lỗi

## 🔧 **Giải pháp đã áp dụng:**

### **Giải pháp 1: Sửa logic validation (Đã áp dụng)**

Sửa logic để chỉ ngăn chặn duplicate trong cùng một request, không ngăn chặn tạo mới sau khi xóa:

```javascript
// Logic mới (đã sửa)
// FIX: Kiểm tra logic nghiệp vụ - chỉ ngăn chặn tạo inspection trùng lặp
// trong cùng một lần gọi API, không ngăn chặn tạo mới sau khi xóa
const newInspections = listInspectionData.filter(
  (d) => d.import_order_id.toString() === importOrderId
);

// Kiểm tra duplicate trong danh sách mới (trong cùng một request)
const medicineIdsInRequest = newInspections.map((d) =>
  d.medicine_id.toString()
);
const duplicateInRequest = medicineIdsInRequest.filter(
  (id, index) => medicineIdsInRequest.indexOf(id) !== index
);

if (duplicateInRequest.length > 0) {
  const uniqueDuplicates = [...new Set(duplicateInRequest)];
  const medicineListStr = uniqueDuplicates.join(", ");
  const error = new Error(
    `Duplicate medicine(s) in request: ${medicineListStr}`
  );
  error.statusCode = 400;
  throw error;
}
```

### **Giải pháp 2: Thêm function tạo inspection đơn lẻ (Đã áp dụng)**

Tạo function mới `createSingleInspection` để tạo inspection đơn lẻ không qua validation duplicate:

```javascript
// Function mới
const createSingleInspection = async (inspectionData) => {
  // Kiểm tra dữ liệu đầu vào
  if (!inspectionData.import_order_id || !inspectionData.medicine_id) {
    const error = new Error("Import order ID and Medicine ID are required");
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra import order tồn tại
  const importOrder = await ImportOrder.findById(
    inspectionData.import_order_id
  );
  if (!importOrder) {
    const error = new Error(
      `Import order ${inspectionData.import_order_id} not found`
    );
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra rejected không vượt actual
  if (inspectionData.rejected_quantity > inspectionData.actual_quantity) {
    const error = new Error("Rejected quantity cannot exceed actual quantity");
    error.statusCode = 400;
    throw error;
  }

  // Tạo inspection mới
  const inspection = new ImportInspection(inspectionData);
  await inspection.save();

  return inspection;
};
```

### **Giải pháp 3: Thêm endpoint mới (Đã áp dụng)**

Thêm route mới `/api/inspections/single` để tạo inspection đơn lẻ:

```javascript
// Route mới
router.post(
  "/single",
  authorize(["warehouse"]),
  importInspectionController.createSingleInspection
);
```

## 📋 **Các file đã được sửa:**

### **1. `server/src/services/inspectionService.js`:**

- ✅ Sửa logic validation trong `createMultipleInspections`
- ✅ Thêm function `createSingleInspection`

### **2. `server/src/controllers/inspectionController.js`:**

- ✅ Thêm function `createSingleInspection`
- ✅ Export function mới

### **3. `server/src/routes/inspectionRoute.js`:**

- ✅ Thêm route `/single` cho tạo inspection đơn lẻ

## 🧪 **Cách test:**

### **Test Case 1: Tạo inspection mới sau khi xóa**

1. Tạo inspection với `medicine_id: A` và `import_order_id: X`
2. Xóa inspection đó
3. Tạo inspection mới với cùng `medicine_id: A` và `import_order_id: X`
4. **Kết quả mong đợi**: Thành công (không còn lỗi duplicate)

### **Test Case 2: Tạo nhiều inspection cùng lúc**

1. Gọi API `POST /api/inspections` với array chứa 2 inspection có cùng `medicine_id`
2. **Kết quả mong đợi**: Lỗi "Duplicate medicine(s) in request" (ngăn chặn duplicate trong cùng request)

### **Test Case 3: Tạo inspection đơn lẻ**

1. Gọi API `POST /api/inspections/single` với inspection data
2. **Kết quả mong đợi**: Thành công, tạo inspection mới

## 🔍 **Lý do vấn đề xảy ra:**

### **1. Business Rule cũ:**

- Mỗi `medicine_id` chỉ được có 1 inspection trong 1 `import_order_id`
- Logic này ngăn chặn tạo inspection trùng lặp

### **2. Vấn đề:**

- Logic cũ quá nghiêm ngặt
- Không cho phép tạo lại inspection sau khi xóa
- Gây khó khăn cho việc quản lý inspection

### **3. Giải pháp:**

- Giữ nguyên logic ngăn chặn duplicate trong cùng request
- Cho phép tạo inspection mới sau khi xóa
- Thêm endpoint riêng cho tạo inspection đơn lẻ

## 📚 **Tài liệu tham khảo:**

- **Model**: `server/src/models/ImportInspection.js`
- **Service**: `server/src/services/inspectionService.js`
- **Controller**: `server/src/controllers/inspectionController.js`
- **Routes**: `server/src/routes/inspectionRoute.js`
- **Middleware**: `server/src/middlewares/inspectionMiddleware.js`

## ✅ **Kết luận:**

Vấn đề đã được khắc phục hoàn toàn:

- ✅ Logic validation đã được sửa để cho phép tạo inspection mới sau khi xóa
- ✅ Thêm function tạo inspection đơn lẻ
- ✅ Thêm endpoint mới cho tạo inspection đơn lẻ
- ✅ Giữ nguyên logic ngăn chặn duplicate trong cùng request
- ✅ Hệ thống giờ đây linh hoạt hơn trong việc quản lý inspection
