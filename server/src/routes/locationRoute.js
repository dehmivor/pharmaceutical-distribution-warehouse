const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/locations-with-batches', locationController.getLocationsWithBatches);
router.get('/', locationController.getAvailableLocations);
router.get('/locations-by-batch/:batchId', locationController.getLocationsByBatchMedicine);
router.get('/location/:locationId', locationController.getLocationWithPackages);
router.get('/:locationId', locationController.getLocationById);

module.exports = router;
