const express = require('express');
const router = express.Router();
const { areaValidator } = require('../middlewares/validate');
const areaController = require('../controllers/areaController');
const authenticate = require('../middlewares/authenticate');

// GET all areas with pagination and search
router.get('/', authenticate, areaValidator.validateGetAllAreas, areaController.getAllAreas);

// POST create new area (supervisor only)
router.post('/', authenticate, areaValidator.validateCreateArea, areaController.createArea);

// GET area by ID
router.get('/:id', authenticate, areaValidator.validateGetAreaById, areaController.getAreaById);

// PUT update area (supervisor only)
router.put('/:id', authenticate, areaValidator.validateUpdateArea, areaController.updateArea);

// DELETE area (supervisor only)
router.delete('/:id', authenticate, areaValidator.validateDeleteArea, areaController.deleteArea);

module.exports = router;
