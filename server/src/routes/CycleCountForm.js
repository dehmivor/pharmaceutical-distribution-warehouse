const express = require('express');
const router = express.Router();

const cycleCountFormController = require('../controllers/CycleCountForm.controller')

router.get('/cyclecountform/:id', cycleCountFormController.getDetailForManager)
router.patch('/cyclecountform/:id/status', cycleCountFormController.updateFormStatus)

module.exports = router