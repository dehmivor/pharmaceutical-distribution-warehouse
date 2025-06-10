const express = require('express');
const router = express.Router();
const checkLowInventory = require('../controllers/cronController'); // Import đúng tên

router.post('/run-task', checkLowInventory); // Dùng đúng tên function

module.exports = router;
