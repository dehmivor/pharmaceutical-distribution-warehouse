const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize'); // Middleware phân quyền

// Lấy danh sách tất cả đơn đặt hàng (có phân trang và lọc)
router.get(
  '/',
  authenticate,
  authorize(['supervisor', 'warehouse']),
  purchaseOrderController.getPurchaseOrders,
);

module.exports = router;
