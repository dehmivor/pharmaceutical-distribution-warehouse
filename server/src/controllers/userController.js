const User = require("../models/User")
const constants = require("../utils/constants")

const userController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const { role, status, page = 1, limit = 10 } = req.query

      const filter = {}
      if (role) {
        // Handle multiple roles separated by comma
        const roles = role.split(",")
        filter.role = { $in: roles }
      }
      if (status) filter.status = status

      const users = await User.find(filter)
        .select("-password -otp_login -otp_reset") // Exclude sensitive fields
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ email: 1 })

      const total = await User.countDocuments(filter)

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params
      const user = await User.findById(id).select("-password -otp_login -otp_reset")

      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" })
      }

      res.json(user)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const userData = req.body
      const user = new User(userData)
      await user.save()

      // Remove sensitive data from response
      const userResponse = user.toObject()
      delete userResponse.password
      delete userResponse.otp_login
      delete userResponse.otp_reset

      res.status(201).json({
        message: "Tạo nhân viên thành công",
        user: userResponse,
      })
    } catch (error) {
      console.error("Error creating user:", error)
      if (error.code === 11000) {
        res.status(400).json({ error: "Email đã tồn tại" })
      } else {
        res.status(500).json({ error: "Không thể tạo nhân viên" })
      }
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params
      const updateData = req.body

      // Don't allow updating sensitive fields through this endpoint
      delete updateData.password
      delete updateData.otp_login
      delete updateData.otp_reset

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password -otp_login -otp_reset")

      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" })
      }

      res.json({
        message: "Cập nhật nhân viên thành công",
        user,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      res.status(500).json({ error: "Không thể cập nhật nhân viên" })
    }
  },

  // Get available staff for assignment
  getAvailableStaff: async (req, res) => {
    try {
      const filter = {
        status: constants.USER_STATUSES.ACTIVE,
        role: { $in: [constants.USER_ROLES.WAREHOUSE_STAFF, constants.USER_ROLES.PACKER] },
      }

      const staff = await User.find(filter).select("-password -otp_login -otp_reset").sort({ email: 1 })

      res.json(staff)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Get staff workload
  getStaffWorkload: async (req, res) => {
    try {
      const WorkAssignment = require("../models/WorkAssignment")

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const workload = await WorkAssignment.aggregate([
        {
          $match: {
            assigned_date: { $gte: today, $lt: tomorrow },
            status: { $in: ["assigned", "in_progress"] },
          },
        },
        {
          $group: {
            _id: "$assigned_to",
            taskCount: { $sum: 1 },
            totalHours: { $sum: "$estimated_hours" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            userId: "$_id",
            email: "$user.email",
            role: "$user.role",
            taskCount: 1,
            totalHours: 1,
            maxTasks: 10, // Default max tasks since it's not in schema
            availability: {
              $subtract: [10, "$taskCount"], // 10 is default max tasks
            },
          },
        },
      ])

      res.json(workload)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Get users by role and status (for warehouse management)
  getUsersByRoleAndStatus: async (req, res) => {
    try {
      const { role, status } = req.query

      const filter = {}
      if (role) {
        // Handle multiple roles separated by comma
        const roles = role.split(",")
        filter.role = { $in: roles }
      }
      if (status) filter.status = status

      const users = await User.find(filter).select("-password -otp_login -otp_reset").sort({ email: 1 })

      res.json({
        success: true,
        data: users,
        count: users.length,
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  },

  // Get user statistics
  getUserStatistics: async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ["$status", constants.USER_STATUSES.ACTIVE] }, 1, 0],
              },
            },
            inactiveUsers: {
              $sum: {
                $cond: [{ $eq: ["$status", constants.USER_STATUSES.INACTIVE] }, 1, 0],
              },
            },
            pendingUsers: {
              $sum: {
                $cond: [{ $eq: ["$status", constants.USER_STATUSES.PENDING] }, 1, 0],
              },
            },
          },
        },
      ])

      const roleStats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])

      const formattedStats = {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
        },
        byRole: roleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count
          return acc
        }, {}),
      }

      res.json({
        success: true,
        data: formattedStats,
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  },

  // Activate user account
  activateUser: async (req, res) => {
    try {
      const { id } = req.params

      const user = await User.findByIdAndUpdate(
        id,
        { status: constants.USER_STATUSES.ACTIVE },
        { new: true, runValidators: true },
      ).select("-password -otp_login -otp_reset")

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      res.json({
        success: true,
        message: "User activated successfully",
        data: user,
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  },

  // Deactivate user account
  deactivateUser: async (req, res) => {
    try {
      const { id } = req.params

      const user = await User.findByIdAndUpdate(
        id,
        { status: constants.USER_STATUSES.INACTIVE },
        { new: true, runValidators: true },
      ).select("-password -otp_login -otp_reset")

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      res.json({
        success: true,
        message: "User deactivated successfully",
        data: user,
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  },

  // Bulk update users
  bulkUpdateUsers: async (req, res) => {
    try {
      const { userIds, updateData } = req.body

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "User IDs array is required",
        })
      }

      // Remove sensitive fields from update data
      delete updateData.password
      delete updateData.otp_login
      delete updateData.otp_reset

      const result = await User.updateMany({ _id: { $in: userIds } }, updateData, { runValidators: true })

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} users successfully`,
        data: {
          matched: result.matchedCount,
          modified: result.modifiedCount,
        },
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  },
}

module.exports = userController
