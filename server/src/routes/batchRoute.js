const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.post('/', batchController.createBatch);
router.post('/assign-batch', batchController.assignBatch);
router.post('/check-capacity', batchController.checkCapacity);
router.get('/', batchController.getAll);
router.get('/valid/:medicineId', batchController.getValidBatches);

module.exports = router;
