const express = require('express');
const router = express.Router();

const cycleCountFormController = require('../controllers/CycleCountForm.controller')

router.get('/test', cycleCountFormController.getDetailForManager)

module.exports = router