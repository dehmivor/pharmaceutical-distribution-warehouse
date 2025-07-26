const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authenticate = require('../middlewares/authenticate');
const { locationValidator } = require('../middlewares/validate');

// New V2 routes for Location Management (MUST be before parameterized routes)
router.get('/v2', authenticate, locationValidator.validateGetAllLocations, locationController.getAllLocations);
router.post('/v2', authenticate, locationValidator.validateCreateLocation, locationController.createLocation);
router.get('/v2/:id/info', authenticate, locationValidator.validateGetLocationInfo, locationController.getLocationInfo);
router.get('/v2/:id', authenticate, locationValidator.validateGetLocationById, locationController.getLocationByIdV2);
router.put('/v2/:id/available', authenticate, locationValidator.validateUpdateLocationAvailable, locationController.updateLocationAvailable);
router.delete('/v2/:id', authenticate, locationValidator.validateDeleteLocation, locationController.deleteLocation);

// Existing routes (keep unchanged)
router.get('/locations-with-batches', locationController.getLocationsWithBatches);
router.get('/', locationController.getAvailableLocations);
router.get('/locations-by-batch/:batchId', locationController.getLocationsByBatchMedicine);
router.get('/location/:locationId', locationController.getLocationWithPackages);
router.get('/:locationId', locationController.getLocationById);

module.exports = router;
