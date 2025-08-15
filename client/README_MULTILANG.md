# 🌍 Hướng dẫn sử dụng hệ thống đa ngôn ngữ (useTrans)

## 📋 Tổng quan

Dự án đã được tích hợp hệ thống đa ngôn ngữ hoàn chỉnh với `useTrans` hook, hỗ trợ tiếng Anh và tiếng Việt.

## 🚀 Cách sử dụng cơ bản

### 1. Import hook useTrans
```jsx
import useTrans from '@/hooks/useTrans';
```

### 2. Sử dụng trong component
```jsx
function MyComponent() {
  const trans = useTrans();
  
  return (
    <div>
      <h1>{trans.header.title}</h1>
      <p>{trans.header.description}</p>
      <button>{trans.actions.save}</button>
    </div>
  );
}
```

## 📁 Cấu trúc file ngôn ngữ

### File tiếng Anh: `client/public/lang/en.js`
### File tiếng Việt: `client/public/lang/vi.js`

Cấu trúc ngôn ngữ được tổ chức theo nhóm:
```javascript
export default {
  header: {
    title: 'Manage User',
    description: 'Administer and oversee user accounts...',
    home: 'Home',
    dashboard: 'Dashboard'
  },
  actions: {
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete'
  },
  status: {
    active: 'Active',
    inactive: 'Inactive'
  }
  // ... các nhóm khác
};
```

## 🔧 Cách thêm ngôn ngữ mới

### 1. Tạo file ngôn ngữ mới
```javascript
// client/public/lang/fr.js
export default {
  header: {
    title: 'Gérer les utilisateurs',
    description: 'Administrer et superviser...'
  }
  // ... các nhóm khác
};
```

### 2. Cập nhật hook useTrans
```javascript
// client/src/hooks/useTrans.js
import fr from '../../public/lang/fr';

export default function useTrans() {
  const { i18n } = useConfig();
  
  const trans = i18n === ThemeI18n.VN ? vi : 
                i18n === ThemeI18n.FR ? fr : en;
  
  // ... phần còn lại
}
```

### 3. Cập nhật config
```javascript
// client/src/config.js
export let ThemeI18n;
(function (ThemeI18n) {
  ThemeI18n['EN'] = 'en';
  ThemeI18n['VN'] = 'vn';
  ThemeI18n['FR'] = 'fr'; // Thêm mới
})(ThemeI18n || (ThemeI18n = {}));
```

## 🎯 Các nhóm ngôn ngữ có sẵn

### Header & Navigation
- `trans.header.title` - Tiêu đề
- `trans.header.description` - Mô tả
- `trans.header.home` - Trang chủ
- `trans.header.dashboard` - Bảng điều khiển

### Actions
- `trans.actions.add` - Thêm
- `trans.actions.edit` - Sửa
- `trans.actions.delete` - Xóa
- `trans.actions.save` - Lưu
- `trans.actions.cancel` - Hủy

### Status
- `trans.status.active` - Hoạt động
- `trans.status.inactive` - Không hoạt động
- `trans.status.pending` - Đang chờ
- `trans.status.completed` - Hoàn thành

### Messages
- `trans.messages.success` - Thành công
- `trans.messages.error` - Lỗi
- `trans.messages.warning` - Cảnh báo
- `trans.messages.loading` - Đang tải

### Form Labels
- `trans.form.name` - Tên
- `trans.form.email` - Email
- `trans.form.phone` - Số điện thoại
- `trans.form.role` - Vai trò

### Roles
- `trans.roles.supervisor` - Giám sát
- `trans.roles.representative` - Đại diện
- `trans.roles.warehouse` - Kho hàng

## 🔄 Chuyển đổi ngôn ngữ

### Sử dụng LanguageSwitcher component
```jsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

### Chuyển đổi bằng code
```jsx
import useConfig from '@/hooks/useConfig';
import { ThemeI18n } from '@/config';

function LanguageButton() {
  const { setI18n } = useConfig();
  
  const changeToVietnamese = () => {
    setI18n(ThemeI18n.VN);
  };
  
  const changeToEnglish = () => {
    setI18n(ThemeI18n.EN);
  };
  
  return (
    <div>
      <button onClick={changeToVietnamese}>Tiếng Việt</button>
      <button onClick={changeToEnglish}>English</button>
    </div>
  );
}
```

## 📱 Responsive và Accessibility

- Ngôn ngữ được lưu trong localStorage
- Tự động chuyển đổi khi thay đổi cấu hình
- Hỗ trợ responsive design
- Tương thích với screen readers

## 🧪 Testing

Sử dụng component `LanguageDemo` để test:
```jsx
import LanguageDemo from '@/components/LanguageDemo';

function TestPage() {
  return <LanguageDemo />;
}
```

## ⚠️ Lưu ý quan trọng

1. **Luôn sử dụng `trans.key` thay vì hardcode text**
2. **Kiểm tra key tồn tại trước khi sử dụng**
3. **Cập nhật cả 2 file ngôn ngữ khi thêm key mới**
4. **Sử dụng cấu trúc phân cấp rõ ràng cho dễ quản lý**

## 🆘 Troubleshooting

### Lỗi key không tồn tại
- Kiểm tra file ngôn ngữ có key đó không
- Đảm bảo cấu trúc object giống nhau giữa 2 file
- Sử dụng `console.log(trans)` để debug

### Ngôn ngữ không thay đổi
- Kiểm tra ConfigContext có được wrap đúng không
- Kiểm tra localStorage có được cập nhật không
- Đảm bảo component được re-render khi thay đổi ngôn ngữ

## 📚 Ví dụ thực tế

### **Components đã được áp dụng:**
- `client/src/components/Breadcrumbs.jsx` ✅
- `client/src/components/DashboardStats.jsx` ✅
- `client/src/components/ConnectionStatus.jsx` ✅
- `client/src/components/Success.jsx` ✅
- `client/src/components/StatusChangeDialog.jsx` ✅
- `client/src/components/Error404.jsx` ✅
- `client/src/components/Error500.jsx` ✅
- `client/src/components/NotificationItem.jsx` ✅
- `client/src/components/Profile.jsx` ✅
- `client/src/components/Contact.jsx` ✅

### **Sections đã được áp dụng:**
- `client/src/sections/supervisor/HeaderSection.jsx` ✅
- `client/src/sections/supervisor/AddUserButton.jsx` ✅
- `client/src/sections/supervisor/activate-account/ContentSection.jsx` ✅
- `client/src/sections/supervisor/activate-account/HeaderSection.jsx` ✅
- `client/src/sections/supervisor/activate-account/TableSection.jsx` ✅

### **Test Components:**
- `client/src/components/LanguageDemo.jsx` - Demo cơ bản
- `client/src/components/MultilangTestPage.jsx` - Test tổng hợp
- `client/src/components/LanguageSwitcher.jsx` - Chuyển đổi ngôn ngữ
