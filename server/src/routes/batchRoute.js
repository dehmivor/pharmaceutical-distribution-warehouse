const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.post('/assign-batch', batchController.assignBatch);
router.post('/check-capacity', batchController.checkCapacity);

module.exports = router;