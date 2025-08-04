const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticate = require('../middlewares/authenticate');

router.get(
  '/inspection-from-order/:id',
  authenticate,
  inventoryController.getInspectionsFromCheckOrder,
);

router.get('/check-order/:id', authenticate, inventoryController.getCheckOrderById);

router.patch('/check-order/:id', authenticate, inventoryController.updateCheckOrderStatus);

router.post('/check-order/:id', authenticate, inventoryController.createCheckInspection);

router.delete('/:id', authenticate, inventoryController.deleteCheckInspection);

router.patch(
  '/check-order/:id/clear-inspections',
  authenticate,
  inventoryController.clearInspections,
);

module.exports = router;
