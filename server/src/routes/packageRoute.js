const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authenticate = require('../middlewares/authenticate');
const { packageValidator } = require('../middlewares/validate');

// V2 routes for Supervisor Package Management (MUST be before parameterized routes)
router.get('/v2', authenticate, packageValidator.validateGetAllPackages, packageController.getAllPackagesV2);
router.get('/v2/:id', authenticate, packageValidator.validateGetPackageById, packageController.getPackageByIdV2);
router.put('/v2/:id', authenticate, packageValidator.validateUpdatePackage, packageController.updatePackageV2);
router.put('/v2/:id/location', authenticate, packageValidator.validateUpdatePackageLocation, packageController.updatePackageLocationV2);

// Get all packages with location info
router.get('/packages', packageController.getAllPackages);

// Get all available locations
router.get('/locations', packageController.getAllLocations);

router.get('/distinct-batches', packageController.getDistinctBatches);


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
