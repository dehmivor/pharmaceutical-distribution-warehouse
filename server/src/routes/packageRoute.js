const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// Get all packages with location info
router.get('/packages', packageController.getAllPackages);

// Get all available locations
router.get('/locations', packageController.getAllLocations);

// Update package location
router.put('/packages/:packageId/location', packageController.updatePackageLocation);

router.put('/packages/:packageId/confirm', packageController.confirmPackageStorage);

// Get packages by location
router.get('/packages/location/:locationId', packageController.getPackagesByLocation);

router.post('/packages', packageController.createPackage);

//For warehouse manager deleting package record before finalizing import order
router.patch('/:packageId/clear-location', packageController.clearLocation);

//Get by import location
router.get("/import-order/:importOrderId", packageController.getPackagesForOrder)

module.exports = router;
