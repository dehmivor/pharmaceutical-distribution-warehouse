const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/locations-with-batches', locationController.getLocationsWithBatches);
router.get('/', locationController.getAvailableLocations);

module.exports = router;