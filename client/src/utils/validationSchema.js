export const emailSchema = {
  required: 'Email là bắt buộc',
  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Định dạng email không hợp lệ' }
};

export const passwordSchema = {
  required: 'Mật khẩu là bắt buộc',
  minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
  validate: {
    noSpaces: (value) => !/\s/.test(value) || 'Mật khẩu không được chứa khoảng trắng',
    hasUpperCase: (value) => /[A-Z]/.test(value) || 'Mật khẩu phải có ít nhất một chữ hoa',
    hasNumber: (value) => /[0-9]/.test(value) || 'Mật khẩu phải có ít nhất một số',
    hasSpecialChar: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Mật khẩu phải có ít nhất một ký tự đặc biệt'
  }
};

export const firstNameSchema = {
  required: 'Tên là bắt buộc',
  minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
  maxLength: { value: 50, message: 'Tên không được vượt quá 50 ký tự' }
};

export const lastNameSchema = {
  required: 'Họ là bắt buộc',
  minLength: { value: 2, message: 'Họ phải có ít nhất 2 ký tự' },
  maxLength: { value: 50, message: 'Họ không được vượt quá 50 ký tự' }
};

export const phoneSchema = {
  required: 'Số điện thoại là bắt buộc',
  pattern: { value: /^[0-9+\-\s()]+$/, message: 'Định dạng số điện thoại không hợp lệ' }
};

export const addressSchema = {
  required: 'Địa chỉ là bắt buộc',
  minLength: { value: 10, message: 'Địa chỉ phải có ít nhất 10 ký tự' },
  maxLength: { value: 200, message: 'Địa chỉ không được vượt quá 200 ký tự' }
};
