const express = require('express');
const router = express.Router();
const runCheckLowInventory = require('../controllers/cron.controller');

router.post('/run-task', runCheckLowInventory);

module.exports = router;
