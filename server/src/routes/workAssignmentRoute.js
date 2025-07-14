const express = require("express")
const router = express.Router()
const workAssignmentController = require("../controllers/workAssignmentController")

// Get all assignments
router.get("/", workAssignmentController.getAllAssignments)

// Get assignment statistics
router.get("/statistics", workAssignmentController.getAssignmentStatistics)

// Auto assign tasks
router.post("/auto-assign", workAssignmentController.autoAssignTasks)

// Create new assignment
router.post("/", workAssignmentController.createAssignment)

// Update assignment status
router.put("/:id/status", workAssignmentController.updateAssignmentStatus)

// Get assignments by user
router.get("/user/:userId", workAssignmentController.getAssignmentsByUser)

module.exports = router
