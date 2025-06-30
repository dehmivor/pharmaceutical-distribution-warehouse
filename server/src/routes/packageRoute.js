const express = require("express")
const router = express.Router()
const packageController = require("../controllers/packageController")

// Get all packages with location info
router.get("/", packageController.getAllPackages)
router.post("/", packageController.createPackage)
router.post("/", packageController.createPackage)

//For warehouse manager deleting package record before finalizing import order
router.patch('/:packageId/clear-location', packageController.clearLocation);

// Update package location (original method)
router.put("/:packageId/location", packageController.updatePackageLocation)

// Update package location with detailed input (new method)
router.put("/:id/location-detailed", packageController.setPackageLocationDetailed)

router.put("/:packageId/confirm", packageController.confirmPackageStorage)

// Get packages by location
router.get("/location/:locationId", packageController.getPackagesByLocation)
router.get("/by-batch/:batchId", packageController.getByBatch)
router.get("/import-order/:importOrderId", packageController.getPackagesForOrder)



module.exports = router
// Original location update method (keep for backward compatibility)
router.put("/:id/location", packageController.setPackageLocation)

module.exports = router
