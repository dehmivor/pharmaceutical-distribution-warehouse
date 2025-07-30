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

// Validation: Kiểm tra contract phải là Retailer contract
exportOrderSchema.pre('save', async function (next) {
  if (this.contract_id) {
    try {
      const Contract = mongoose.model('Contract');
      const contract = await Contract.findById(this.contract_id);

      if (!contract) {
        return next(new Error('Contract not found'));
      }

      if (contract.partner_type !== 'Retailer') {
        return next(new Error('Export orders can only be created for retailer contracts'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("ExportOrder", exportOrderSchema)
