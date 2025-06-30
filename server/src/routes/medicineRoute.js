// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

// === MEDICINE ROUTES ===

router.use(authenticate);
router.get('/',medicineController.getMedicinesPaging);


router.get('/filter-options', medicineController.getFilterOptions);


router.get('/detail/:id', medicineController.getMedicineById);


router.post('/', medicineController.createMedicine);


router.put('/:id', medicineController.updateMedicine);

router.delete('/:id', medicineController.deleteMedicine);

router.get('/all/v1', medicineController.getAllMedicines);

module.exports = router;
