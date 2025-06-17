// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authenticate = require('../middlewares/authenticate'); // Giả sử bạn có middleware này

// === MEDICINE ROUTES ===

/**
 * @route GET /api/medicines
 * @desc Get all medicines with optional filters
 * @access Private
 * @query {string} dosage_form - Filter by dosage form (tablet, capsule, syrup, injection)
 * @query {string} target_customer - Filter by target customer (all, children, adults, seniors)
 * @query {string} unit_of_measure - Filter by unit (g, ml, tablet, bottle, vial, pack)
 * @query {string} category - Filter by category (partial match)
 * @query {string} medicine_name - Filter by medicine name (partial match)
 * @query {number} page - Page number for pagination (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get('/', medicineController.getAllMedicines);

/**
 * @route GET /api/medicines/filter-options
 * @desc Get available filter options for dropdown menus
 * @access Private
 */
router.get('/filter-options', medicineController.getFilterOptions);

/**
 * @route GET /api/medicines/stats
 * @desc Get medicine statistics
 * @access Private
 */
router.get('/stats', medicineController.getMedicineStats);

/**
 * @route GET /api/medicines/:id
 * @desc Get medicine by ID
 * @access Private
 */
router.get('/:id', medicineController.getMedicineById);

/**
 * @route POST /api/medicines
 * @desc Create new medicine
 * @access Private
 * @body {object} medicineData - Medicine information
 * @body {string} medicineData.medicine_name - Medicine name (required)
 * @body {string} medicineData.medicine_code - Unique medicine code (required)
 * @body {string} medicineData.category - Medicine category (required)
 * @body {object} medicineData.storage_conditions - Storage requirements (optional)
 * @body {string} medicineData.dosage_form - Dosage form: tablet, capsule, syrup, injection (required)
 * @body {string} medicineData.target_customer - Target customer: all, children, adults, seniors (optional, default: all)
 * @body {number} medicineData.min_stock_threshold - Minimum stock threshold (optional, default: 0)
 * @body {number} medicineData.max_stock_threshold - Maximum stock threshold (optional, default: 0)
 * @body {string} medicineData.unit_of_measure - Unit: g, ml, tablet, bottle, vial, pack (required)
 * @body {string} medicineData.description - Medicine description (optional)
 */
router.post('/', medicineController.createMedicine);

/**
 * @route PUT /api/medicines/:id
 * @desc Update medicine by ID
 * @access Private
 * @body {object} updateData - Fields to update
 */
router.put('/:id', medicineController.updateMedicine);

/**
 * @route DELETE /api/medicines/:id
 * @desc Delete medicine by ID
 * @access Private
 */
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
