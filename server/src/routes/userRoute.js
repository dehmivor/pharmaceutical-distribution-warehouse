const express = require("express")
const userController = require("../controllers/userController") // Đảm bảo đường dẫn đúng

const router = express.Router()

// Route để lấy danh sách người dùng (có thể lọc theo role)
// Đảm bảo gọi đúng hàm được export: userController.getAllUsers
router.route("/").get(userController.getAllUsers) // Đã sửa từ .getUsers thành .getAllUsers

module.exports = router