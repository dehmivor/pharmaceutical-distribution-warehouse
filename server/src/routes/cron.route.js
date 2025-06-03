const express = require('express');
const router = express.Router();
const checkLowInventory = require('../controllers/cron.controller'); // Import đúng tên

router.post('/run-task', checkLowInventory); // Dùng đúng tên function

module.exports = router;
