const express = require('express');
const { body, query, param } = require('express-validator');
const accountController = require('../controllers/accountController');
const {
  authenticateToken,
  authorizeSupervisor,
  authorizeSelfOrSupervisor,
  authorizeRole,
  validateObjectId,
  checkAccountStatus,
  preventSelfPrivilegeEscalation,
  auditLogger,
} = require('../middlewares/accountMiddleware');

const router = express.Router();

// Apply rate limiting và authentication cho tất cả routes
router.use(authenticateToken);

// Routes với middleware cụ thể

// Tạo account đơn lẻ - chỉ supervisor + rate limit + audit
router.post(
  '/create',
  authorizeSupervisor,
  auditLogger('CREATE_ACCOUNT'),
  accountController.createSingleAccount,
);

// Lấy statistics - chỉ supervisor
router.get('/statistics', authorizeSupervisor, accountController.getAccountStatistics);

// Lấy danh sách accounts - role-based access
router.get('/', accountController.getAccounts);

// Lấy account theo ID - self hoặc supervisor + validate ID
router.get(
  '/:id',
  validateObjectId('id'),
  checkAccountStatus,
  authorizeSelfOrSupervisor,
  accountController.getAccountById,
);

// Cập nhật account - self hoặc supervisor + prevent privilege escalation
router.put(
  '/:id',
  validateObjectId('id'),
  checkAccountStatus,
  authorizeSelfOrSupervisor,
  preventSelfPrivilegeEscalation,
  auditLogger('UPDATE_ACCOUNT'),
  accountController.updateAccount,
);

// Reset password - self hoặc supervisor + audit
router.post(
  '/:id/reset-password',
  validateObjectId('id'),
  checkAccountStatus,
  authorizeSelfOrSupervisor,
  auditLogger('RESET_PASSWORD'),
  accountController.resetAccountPassword,
);

// Xóa account - chỉ supervisor + audit
router.delete(
  '/:id',
  validateObjectId('id'),
  checkAccountStatus,
  authorizeSupervisor,
  auditLogger('DELETE_ACCOUNT'),
  accountController.deleteAccount,
);

// Khôi phục account - chỉ supervisor + audit
router.post(
  '/:id/restore',
  validateObjectId('id'),
  authorizeSupervisor,
  auditLogger('RESTORE_ACCOUNT'),
  accountController.restoreAccount,
);

module.exports = router;
