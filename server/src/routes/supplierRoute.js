const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

// Get all suppliers
router.get('/all/v1', supplierController.getAllSuppliers);

// Get suppliers for management with pagination and filters
router.get('/management', supplierController.getSuppliersForManagement);

// Get supplier by ID
router.get('/:id', supplierController.getSupplierById);

// Create new supplier
router.post('/', supplierController.createSupplier);

// Update supplier
router.put('/:id', supplierController.updateSupplier);

// Delete supplier
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
