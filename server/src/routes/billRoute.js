const express = require('express');
const { billController } = require('../controllers');
const router = express.Router();

router.get('/', billController.getAllBills);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);
router.delete('/:id', billController.deleteBill)

module.exports = router;
