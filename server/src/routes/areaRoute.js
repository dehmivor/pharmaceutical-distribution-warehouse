const express = require("express")
const router = express.Router()
const areaController = require("../controllers/areaController")

// Get all areas
router.get("/", areaController.getAllAreas)

// Get area by ID
router.get("/:id", areaController.getAreaById)

// Create new area
router.post("/", areaController.createArea)

// Update area
router.put("/:id", areaController.updateArea)

// Delete area
router.delete("/:id", areaController.deleteArea)

module.exports = router
