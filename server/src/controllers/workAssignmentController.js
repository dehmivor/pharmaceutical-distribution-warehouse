const WorkAssignment = require("../models/WorkAssignment")
const User = require("../models/User")
const Batch = require("../models/Batch")
const constants = require("../utils/constants")

const workAssignmentController = {
  // Get all assignments
  getAllAssignments: async (req, res) => {
    try {
      const { status, assigned_to, task_type, page = 1, limit = 10 } = req.query

      const filter = {}
      if (status) filter.status = status
      if (assigned_to) filter.assigned_to = assigned_to
      if (task_type) filter.task_type = task_type

      const assignments = await WorkAssignment.find(filter)
        .populate("batch_id", "batch_code")
        .populate("assigned_by", "email role")
        .populate("assigned_to", "email role")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ assigned_date: -1 })

      const total = await WorkAssignment.countDocuments(filter)

      res.json({
        assignments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Create new assignment
  createAssignment: async (req, res) => {
    try {
      const { batch_id, assigned_by, assigned_to, task_type, priority, due_date, estimated_hours, notes } = req.body

      // Generate assignment ID
      const count = await WorkAssignment.countDocuments()
      const assignment_id = `WA-${String(count + 1).padStart(6, "0")}`

      const assignment = new WorkAssignment({
        assignment_id,
        batch_id,
        assigned_by,
        assigned_to,
        task_type,
        priority,
        due_date,
        estimated_hours,
        notes,
      })

      await assignment.save()

      const populatedAssignment = await WorkAssignment.findById(assignment._id)
        .populate("batch_id", "batch_code")
        .populate("assigned_by", "email role")
        .populate("assigned_to", "email role")

      res.status(201).json({
        message: "Phân công công việc thành công",
        assignment: populatedAssignment,
      })
    } catch (error) {
      console.error("Error creating assignment:", error)
      res.status(500).json({ error: "Không thể tạo phân công" })
    }
  },

  // Update assignment status
  updateAssignmentStatus: async (req, res) => {
    try {
      const { id } = req.params
      const { status, completion_notes, actual_hours } = req.body

      const updateData = { status }

      if (status === "in_progress" && !req.body.started_at) {
        updateData.started_at = new Date()
      }

      if (status === "completed") {
        updateData.completed_at = new Date()
        if (completion_notes) updateData.completion_notes = completion_notes
        if (actual_hours) updateData.actual_hours = actual_hours
      }

      const assignment = await WorkAssignment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate("batch_id", "batch_code")
        .populate("assigned_by", "email role")
        .populate("assigned_to", "email role")

      if (!assignment) {
        return res.status(404).json({ error: "Không tìm thấy phân công" })
      }

      res.json({
        message: "Cập nhật trạng thái thành công",
        assignment,
      })
    } catch (error) {
      console.error("Error updating assignment:", error)
      res.status(500).json({ error: "Không thể cập nhật phân công" })
    }
  },

  // Auto assign tasks
  autoAssignTasks: async (req, res) => {
    try {
      const { batch_ids, task_type, priority, due_date, estimated_hours, assigned_by } = req.body

      // Get available staff
      const availableStaff = await User.find({
        status: constants.USER_STATUSES.ACTIVE,
        role: { $in: [constants.USER_ROLES.WAREHOUSE_STAFF, constants.USER_ROLES.PACKER] },
      }).select("-password -otp_login -otp_reset")

      if (availableStaff.length === 0) {
        return res.status(400).json({ error: "Không có nhân viên khả dụng" })
      }

      // Get current workload
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
          },
        },
      ])

      const workloadMap = {}
      workload.forEach((w) => {
        workloadMap[w._id.toString()] = w.taskCount
      })

      // Sort staff by current workload (ascending)
      const sortedStaff = availableStaff.sort((a, b) => {
        const aWorkload = workloadMap[a._id.toString()] || 0
        const bWorkload = workloadMap[b._id.toString()] || 0
        return aWorkload - bWorkload
      })

      const assignments = []
      let staffIndex = 0

      for (const batch_id of batch_ids) {
        const staff = sortedStaff[staffIndex % sortedStaff.length]

        const count = await WorkAssignment.countDocuments()
        const assignment_id = `WA-${String(count + assignments.length + 1).padStart(6, "0")}`

        const assignment = new WorkAssignment({
          assignment_id,
          batch_id,
          assigned_by,
          assigned_to: staff._id,
          task_type,
          priority,
          due_date,
          estimated_hours,
          notes: "Tự động phân công",
        })

        assignments.push(assignment)
        staffIndex++
      }

      await WorkAssignment.insertMany(assignments)

      const populatedAssignments = await WorkAssignment.find({
        _id: { $in: assignments.map((a) => a._id) },
      })
        .populate("batch_id", "batch_code")
        .populate("assigned_by", "email role")
        .populate("assigned_to", "email role")

      res.json({
        message: `Đã tự động phân công ${assignments.length} công việc`,
        assignments: populatedAssignments,
      })
    } catch (error) {
      console.error("Error auto assigning tasks:", error)
      res.status(500).json({ error: "Không thể tự động phân công" })
    }
  },

  // Get assignments by user
  getAssignmentsByUser: async (req, res) => {
    try {
      const { userId } = req.params
      const { status } = req.query

      const filter = { assigned_to: userId }
      if (status) filter.status = status

      const assignments = await WorkAssignment.find(filter)
        .populate("batch_id", "batch_code")
        .populate("assigned_by", "email role")
        .sort({ assigned_date: -1 })

      res.json(assignments)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // Get assignment statistics
  getAssignmentStatistics: async (req, res) => {
    try {
      const stats = await WorkAssignment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])

      const taskTypeStats = await WorkAssignment.aggregate([
        {
          $group: {
            _id: "$task_type",
            count: { $sum: 1 },
          },
        },
      ])

      const formattedStats = {
        status: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count
          return acc
        }, {}),
        taskType: taskTypeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count
          return acc
        }, {}),
      }

      res.json(formattedStats)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
}

module.exports = workAssignmentController
