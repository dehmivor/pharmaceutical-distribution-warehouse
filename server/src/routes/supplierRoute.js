const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

router.get('/all/v1', supplierController.getAllSuppliers);

module.exports = router;