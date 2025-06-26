const express = require('express');
const { billController } = require('../controllers');
const router = express.Router();

router.get('/', billController.getAllBills);

module.exports = router;
