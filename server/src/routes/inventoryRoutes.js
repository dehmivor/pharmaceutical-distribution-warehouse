const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticate = require('../middlewares/authenticate');

router.get(
  '/inspection-from-order/:id',
  authenticate,
  inventoryController.getInspectionsFromCheckOrder,
);

router.post('/', authenticate, inventoryController.createCheckInspection);

router.delete('/:id', authenticate, inventoryController.deleteCheckInspection);

module.exports = router;
