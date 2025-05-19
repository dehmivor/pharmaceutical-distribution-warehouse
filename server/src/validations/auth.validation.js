const Joi = require('joi');

/**
 * Validation schemas cho authentication
 */
const authValidation = {
  /**
   * Schema validation cho đăng ký
   */
  register: {
    body: Joi.object({
      fullName: Joi.string().required().trim().min(2).max(100).messages({
        'string.empty': 'Họ tên không được để trống',
        'string.min': 'Họ tên phải có ít nhất {#limit} ký tự',
        'string.max': 'Họ tên không được vượt quá {#limit} ký tự',
        'any.required': 'Họ tên là bắt buộc',
      }),
      email: Joi.string().required().email().lowercase().trim().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
      password: Joi.string()
        .required()
        .min(6)
        .max(30)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$'))
        .messages({
          'string.empty': 'Mật khẩu không được để trống',
          'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
          'string.max': 'Mật khẩu không được vượt quá {#limit} ký tự',
          'string.pattern.base': 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
          'any.required': 'Mật khẩu là bắt buộc',
        }),
      confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
        'string.empty': 'Xác nhận mật khẩu không được để trống',
        'any.only': 'Xác nhận mật khẩu không khớp',
        'any.required': 'Xác nhận mật khẩu là bắt buộc',
      }),
      role: Joi.string().valid('user', 'admin').default('user').messages({
        'any.only': 'Vai trò không hợp lệ',
      }),
    }),
  },

  /**
   * Schema validation cho đăng nhập
   */
  login: {
    body: Joi.object({
      email: Joi.string().required().email().lowercase().trim().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
      password: Joi.string().required().messages({
        'string.empty': 'Mật khẩu không được để trống',
        'any.required': 'Mật khẩu là bắt buộc',
      }),
      rememberMe: Joi.boolean().default(false),
    }),
  },

  /**
   * Schema validation cho đổi mật khẩu
   */
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required().messages({
        'string.empty': 'Mật khẩu hiện tại không được để trống',
        'any.required': 'Mật khẩu hiện tại là bắt buộc',
      }),
      newPassword: Joi.string()
        .required()
        .min(6)
        .max(30)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$'))
        .disallow(Joi.ref('currentPassword'))
        .messages({
          'string.empty': 'Mật khẩu mới không được để trống',
          'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
          'string.max': 'Mật khẩu mới không được vượt quá {#limit} ký tự',
          'string.pattern.base':
            'Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường và một số',
          'any.required': 'Mật khẩu mới là bắt buộc',
          'any.invalid': 'Mật khẩu mới không được giống mật khẩu hiện tại',
        }),
      confirmNewPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
        'string.empty': 'Xác nhận mật khẩu mới không được để trống',
        'any.only': 'Xác nhận mật khẩu mới không khớp',
        'any.required': 'Xác nhận mật khẩu mới là bắt buộc',
      }),
    }),
  },

  /**
   * Schema validation cho quên mật khẩu
   */
  forgotPassword: {
    body: Joi.object({
      email: Joi.string().required().email().lowercase().trim().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
    }),
  },

  /**
   * Schema validation cho đặt lại mật khẩu
   */
  resetPassword: {
    body: Joi.object({
      token: Joi.string().required().messages({
        'string.empty': 'Token không được để trống',
        'any.required': 'Token là bắt buộc',
      }),
      password: Joi.string()
        .required()
        .min(6)
        .max(30)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$'))
        .messages({
          'string.empty': 'Mật khẩu không được để trống',
          'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
          'string.max': 'Mật khẩu không được vượt quá {#limit} ký tự',
          'string.pattern.base': 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
          'any.required': 'Mật khẩu là bắt buộc',
        }),
      confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
        'string.empty': 'Xác nhận mật khẩu không được để trống',
        'any.only': 'Xác nhận mật khẩu không khớp',
        'any.required': 'Xác nhận mật khẩu là bắt buộc',
      }),
    }),
  },
};

/**
 * Middleware validate request
 * @param {Object} schema - Schema validation
 * @returns {Function} - Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }

  Object.assign(req, value);
  return next();
};

/**
 * Helper để chọn các thuộc tính từ một đối tượng
 * @param {Object} object - Đối tượng cần chọn thuộc tính
 * @param {Array} keys - Danh sách các key cần chọn
 * @returns {Object} - Đối tượng mới chỉ chứa các thuộc tính đã chọn
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

module.exports = {
  authValidation,
  validate,
  pick,
};
