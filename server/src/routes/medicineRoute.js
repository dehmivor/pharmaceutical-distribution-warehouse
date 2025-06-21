// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

// === MEDICINE ROUTES ===


router.get('/', medicineController.getAllMedicines);


router.get('/filter-options', medicineController.getFilterOptions);


router.get('/:id', medicineController.getMedicineById);


router.post('/', medicineController.createMedicine);


router.put('/:id', medicineController.updateMedicine);

router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
