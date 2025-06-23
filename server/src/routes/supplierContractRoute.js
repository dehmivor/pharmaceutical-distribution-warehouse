const express = require('express');
const router = express.Router();
const supplierContractController = require('../controllers/supplierContractController');
const { supplierContract } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
// Routes
router.get('/', supplierContract.validateGetAllContracts, supplierContractController.getAllSupplierContracts);
router.post('/', supplierContract.validateCreateContract, authenticate, supplierContractController.createSupplierContract);

module.exports = router;