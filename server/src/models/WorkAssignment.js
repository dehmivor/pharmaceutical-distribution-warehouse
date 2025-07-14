const mongoose = require("mongoose")

const workAssignmentSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: String,
      required: [true, "Assignment ID is required"],
      unique: true,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch ID is required"],
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned by is required"],
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned to is required"],
    },
    task_type: {
      type: String,
      enum: ["packing", "quality_check", "inventory_count", "location_update"],
      required: [true, "Task type is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed", "cancelled"],
      default: "assigned",
    },
    assigned_date: {
      type: Date,
      default: Date.now,
    },
    due_date: {
      type: Date,
      required: [true, "Due date is required"],
    },
    started_at: Date,
    completed_at: Date,
    estimated_hours: {
      type: Number,
      min: 0.5,
      max: 24,
    },
    actual_hours: Number,
    notes: String,
    completion_notes: String,
  },
  {
    timestamps: true,
  },
)

workAssignmentSchema.index({ assigned_to: 1, status: 1 })
workAssignmentSchema.index({ batch_id: 1 })
workAssignmentSchema.index({ assigned_date: 1 })

module.exports = mongoose.model("WorkAssignment", workAssignmentSchema)
