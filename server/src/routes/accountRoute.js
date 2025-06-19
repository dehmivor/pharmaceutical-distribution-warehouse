// const express = require('express');
// const { body, query, param } = require('express-validator');
// const authMiddleware = require('../middlewares/index');

// const router = express.Router();

// // Validation schemas
// const provisionAccountValidation = [
//   body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
//   body('role')
//     .isIn(['supervisor', 'representative', 'warehouse'])
//     .withMessage('Role must be supervisor, representative, or warehouse'),
//   body('alias')
//     .optional()
//     .isLength({ min: 1, max: 20 })
//     .matches(/^[a-zA-Z0-9_-]+$/)
//     .withMessage('Alias must be alphanumeric with dashes/underscores only'),
//   body('is_manager').optional().isBoolean().withMessage('is_manager must be boolean'),
//   body('generatePassword').optional().isBoolean().withMessage('generatePassword must be boolean'),
//   body('customPassword')
//     .optional()
//     .isLength({ min: 6 })
//     .withMessage('Password must be at least 6 characters'),
//   body('permissions').optional().isArray().withMessage('Permissions must be an array'),
// ];

// const bulkAccountValidation = [
//   body('accounts')
//     .isArray({ min: 1, max: 100 })
//     .withMessage('Accounts must be an array with 1-100 items'),
//   body('accounts.*.email')
//     .isEmail()
//     .normalizeEmail()
//     .withMessage('Each account must have a valid email'),
//   body('accounts.*.role')
//     .optional()
//     .isIn(['supervisor', 'representative', 'warehouse'])
//     .withMessage('Role must be supervisor, representative, or warehouse'),
//   body('defaultRole')
//     .optional()
//     .isIn(['supervisor', 'representative', 'warehouse'])
//     .withMessage('Default role must be supervisor, representative, or warehouse'),
//   body('defaultAlias')
//     .optional()
//     .isLength({ min: 1, max: 20 })
//     .matches(/^[a-zA-Z0-9_-]+$/)
//     .withMessage('Default alias must be alphanumeric with dashes/underscores only'),
// ];

// const updateAccountValidation = [
//   param('id').isMongoId().withMessage('Valid user ID is required'),
//   body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
//   body('role')
//     .optional()
//     .isIn(['supervisor', 'representative', 'warehouse'])
//     .withMessage('Role must be supervisor, representative, or warehouse'),
//   body('alias')
//     .optional()
//     .isLength({ min: 1, max: 20 })
//     .matches(/^[a-zA-Z0-9_-]+$/)
//     .withMessage('Alias must be alphanumeric with dashes/underscores only'),
//   body('is_manager').optional().isBoolean().withMessage('is_manager must be boolean'),
//   body('status')
//     .optional()
//     .isIn(['active', 'inactive'])
//     .withMessage('Status must be active or inactive'),
// ];

// const resetPasswordValidation = [
//   param('id').isMongoId().withMessage('Valid user ID is required'),
//   body('generateNew').optional().isBoolean().withMessage('generateNew must be boolean'),
//   body('customPassword')
//     .optional()
//     .isLength({ min: 6 })
//     .withMessage('Custom password must be at least 6 characters'),
// ];

// const getAccountsValidation = [
//   query('role')
//     .optional()
//     .isIn(['supervisor', 'representative', 'warehouse'])
//     .withMessage('Role must be supervisor, representative, or warehouse'),
//   query('alias')
//     .optional()
//     .isLength({ min: 1, max: 20 })
//     .matches(/^[a-zA-Z0-9_-]+$/)
//     .withMessage('Alias must be alphanumeric with dashes/underscores only'),
//   query('is_manager').optional().isBoolean().withMessage('is_manager must be boolean'),
//   query('status')
//     .optional()
//     .isIn(['active', 'inactive'])
//     .withMessage('Status must be active or inactive'),
//   query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
//   query('limit')
//     .optional()
//     .isInt({ min: 1, max: 100 })
//     .withMessage('Limit must be between 1 and 100'),
//   query('sortBy')
//     .optional()
//     .isIn(['createdAt', 'email', 'role', 'status'])
//     .withMessage('SortBy must be createdAt, email, role, or status'),
//   query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be asc or desc'),
// ];

// // 1. Cấp tài khoản đơn lẻ
// // POST /api/accounts
// router.post('/', provisionAccountValidation, accountRoute.provisionSingleAccount);

// // 2. Cấp tài khoản hàng loạt
// // POST /api/accounts/bulk
// router.post('/bulk', bulkAccountValidation, accountRoute.provisionBulkAccounts);

// // 3. Cấp tài khoản PDWA (shortcut)
// // POST /api/accounts/pdwa
// router.post(
//   '/pdwa',
//   [
//     body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
//     body('role')
//       .optional()
//       .isIn(['supervisor', 'representative', 'warehouse'])
//       .withMessage('Role must be supervisor, representative, or warehouse'),
//     body('is_manager').optional().isBoolean().withMessage('is_manager must be boolean'),
//   ],
//   accountRoute.provisionPdwaAccount,
// );

// // 4. Lấy danh sách tài khoản với filter
// // GET /api/accounts
// router.get('/', getAccountsValidation, accountRoute.getAccountsByFilter);

// // 5. Lấy thống kê tài khoản
// // GET /api/accounts/statistics
// router.get('/statistics', accountRoute.getAccountStatistics);

// // 6. Lấy thông tin tài khoản theo ID
// // GET /api/accounts/:id
// router.get(
//   '/:id',
//   [param('id').isMongoId().withMessage('Valid user ID is required')],
//   accountRoute.getAccountById,
// );

// // 7. Cập nhật quyền tài khoản
// // PUT /api/accounts/:id/permissions
// router.put('/:id/permissions', updateAccountValidation, accountRoute.updateAccountPermissions);

// // 8. Đặt lại password
// // POST /api/accounts/:id/reset-password
// router.post('/:id/reset-password', resetPasswordValidation, accountRoute.resetAccountPassword);

// // 9. Lấy tài khoản theo bí danh cụ thể
// // GET /api/accounts/alias/:alias
// router.get(
//   '/alias/:alias',
//   [
//     param('alias')
//       .isLength({ min: 1, max: 20 })
//       .matches(/^[a-zA-Z0-9_-]+$/)
//       .withMessage('Alias must be alphanumeric with dashes/underscores only'),
//     ...getAccountsValidation.filter((validation) => !validation.builder.fields.includes('alias')),
//   ],
//   (req, res, next) => {
//     // Thêm alias vào query từ params
//     req.query.alias = req.params.alias;
//     next();
//   },
//   accountRoute.getAccountsByFilter,
// );

// // 10. Lấy tài khoản theo role cụ thể
// // GET /api/accounts/role/:role
// router.get(
//   '/role/:role',
//   [
//     param('role')
//       .isIn(['supervisor', 'representative', 'warehouse'])
//       .withMessage('Role must be supervisor, representative, or warehouse'),
//     ...getAccountsValidation.filter((validation) => !validation.builder.fields.includes('role')),
//   ],
//   (req, res, next) => {
//     // Thêm role vào query từ params
//     req.query.role = req.params.role;
//     next();
//   },
//   accountRoute.getAccountsByFilter,
// );

// // Error handling middleware cho routes này
// router.use((error, req, res, next) => {
//   console.error('Account route error:', error);

//   if (error.name === 'ValidationError') {
//     return res.status(400).json({
//       success: false,
//       message: 'Validation error',
//       errors: error.errors,
//     });
//   }

//   if (error.name === 'UnauthorizedError') {
//     return res.status(401).json({
//       success: false,
//       message: 'Unauthorized access',
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//   });
// });

// module.exports = router;
