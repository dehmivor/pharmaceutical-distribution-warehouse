const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticate = require('../middlewares/authenticate');

router.get(
  '/inspection-from-order/:id',
  authenticate,
  inventoryController.getInspectionsFromCheckOrder,
);

module.exports = router;
