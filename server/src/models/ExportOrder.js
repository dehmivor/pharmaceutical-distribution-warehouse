// models/ExportOrder.js
const mongoose = require("mongoose")
const { exportOrderDetailsSchema } = require("./subSchemas")
const { EXPORT_ORDER_STATUSES } = require("../utils/constants")


const exportOrderSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "Contract ID is required"],
    },
    warehouse_manager_id: {
      // This field will be used for the assigned warehouse staff
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(EXPORT_ORDER_STATUSES),
        message: `Status must be one of: ${Object.values(EXPORT_ORDER_STATUSES).join(", ")}`,
      },
      default: EXPORT_ORDER_STATUSES.DRAFT,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    approval_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    details: [exportOrderDetailsSchema],
  },
  { timestamps: true }, // Add timestamps for createdAt and updatedAt
)

const exportOrderSchema = new mongoose.Schema({
  contract_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: [true, 'Contract ID is required'],
  },
  warehouse_manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(EXPORT_ORDER_STATUSES),
      message: `Status must be one of: ${Object.values(EXPORT_ORDER_STATUSES).join(', ')}`,
    },
    default: EXPORT_ORDER_STATUSES.DRAFT,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
  },
  approval_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  details: [exportOrderDetailsSchema],
});

module.exports = mongoose.model("ExportOrder", exportOrderSchema)
