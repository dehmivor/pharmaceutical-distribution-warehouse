const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

router.get('/all/v1', retailerController.getAllRetailers);

module.exports = router; 