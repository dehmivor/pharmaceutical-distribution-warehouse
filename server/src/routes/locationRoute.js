const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/locations-with-batches', locationController.getLocationsWithBatches);
router.get('/locations', locationController.getAvailableLocations);

module.exports = router;