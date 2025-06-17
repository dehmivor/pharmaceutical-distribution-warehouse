const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticate } = require('../middlewares/authenticate');


// Tất cả routes đều yêu cầu xác thực
// router.use(authenticateToken);

// Routes cho tất cả người dùng đã xác thực
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

// Routes chỉ cho representative
router.post('/', 
  // checkRole(['representative']), 
  purchaseOrderController.createPurchaseOrder
);

router.put('/:id', 
  // checkRole(['representative']), 
  purchaseOrderController.updatePurchaseOrder
);

router.delete('/:id', 
  // checkRole(['representative']), 
  purchaseOrderController.deletePurchaseOrder
);

// Route chỉ cho supervisor cập nhật status
router.put('/:id/status', 
  // checkRole(['supervisor']), 
  purchaseOrderController.updateOrderStatus
);

module.exports = router; 