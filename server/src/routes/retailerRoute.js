const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

// Get all retailers
router.get('/all/v1', retailerController.getAllRetailers);

// Get retailers for management with pagination and filters
router.get('/management', retailerController.getRetailersForManagement);

// Get retailer by ID
router.get('/:id', retailerController.getRetailerById);

// Create new retailer
router.post('/', retailerController.createRetailer);

// Update retailer
router.put('/:id', retailerController.updateRetailer);

// Delete retailer
router.delete('/:id', retailerController.deleteRetailer);

module.exports = router; 