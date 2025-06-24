const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/inspectionController');
const authorize = require('../middlewares/authorize');

router.post('/', importInspectionController.createInspection);

router.get('/', importInspectionController.getInspections);

router.get('/:id', importInspectionController.getInspectionById);

router.put('/:id', importInspectionController.updateInspection);

router.delete('/:id', authorize(['admin', 'manager']), importInspectionController.deleteInspection);

router.get('/statistics/:importOrderId', importInspectionController.getInspectionStatistics);

module.exports = router;
