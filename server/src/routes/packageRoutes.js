const express = require("express")
const router = express.Router()
const packageController = require("../controllers/packageController")

// Get all packages with location info
router.get("/packages", packageController.getAllPackages)

// Get all available locations
router.get("/locations", packageController.getAllLocations)

// Update package location
router.put("/packages/:packageId/location", packageController.updatePackageLocation)

// Get packages by location
router.get("/packages/location/:locationId", packageController.getPackagesByLocation)

module.exports = router