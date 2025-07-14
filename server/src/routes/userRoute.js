const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")

// Get all users
router.get("/", userController.getAllUsers)

// Get available staff
router.get("/available-staff", userController.getAvailableStaff)

// Get staff workload
router.get("/workload", userController.getStaffWorkload)

// Get user by ID
router.get("/:id", userController.getUserById)

// Create new user
router.post("/", userController.createUser)

// Update user
router.put("/:id", userController.updateUser)

module.exports = router
