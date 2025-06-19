const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticate } = require('../middlewares/authenticate');


// Tất cả routes đều yêu cầu xác thực
// router.use(authenticateToken);

// Routes cho tất cả người dùng đã xác thực
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/search/:keyword', purchaseOrderController.searchPurchaseOrders);
router.get('/statistics', purchaseOrderController.getStatistics);
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

// Additional routes for approval workflow
router.patch('/:id/submit', purchaseOrderController.submitForApproval);
router.patch('/:id/approve', purchaseOrderController.approve);
router.patch('/:id/reject', purchaseOrderController.reject);

module.exports = router; 