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
router.get('/location/:locationId', packageController.getPackagesByLocation);

router.post('/', packageController.createPackage);

//For warehouse manager deleting package record before finalizing import order
router.patch('/:packageId/clear-location', packageController.clearLocation);

//Get by import location
router.get('/import-order/:importOrderId', packageController.getPackagesForOrder);

router.patch('/:packageId/location', packageController.addLocationToPackage);

router.get('/:packageId/related-locations', packageController.getRelatedLocations);


router.get('/:medicineId/packages', packageController.getPackagesByMedicineInExport);

router.get('/:id', packageController.getPackageById);

router.get('/:batchId', packageController.getByBatch);


module.exports = router; 
