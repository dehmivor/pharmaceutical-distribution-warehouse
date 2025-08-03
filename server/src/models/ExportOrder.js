// models/ExportOrder.js
const mongoose = require("mongoose")
const { exportOrderDetailsSchema } = require("./subSchemas")
const { EXPORT_ORDER_STATUSES } = require("../utils/constants")


const exportOrderSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: false,
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

// Validation: Cho phép Representative sửa rejected orders và chuyển về draft
exportOrderSchema.pre('save', async function (next) {
  // Nếu đây là update (không phải create mới)
  if (!this.isNew) {
    const User = mongoose.model('User');
    
    // Lấy thông tin user hiện tại từ context (sẽ được set trong service)
    const currentUser = this.currentUser;
    
    if (currentUser && currentUser.role === 'representative') {
      // Representative chỉ có thể sửa draft hoặc rejected orders
      const originalDoc = await this.constructor.findById(this._id);
      if (originalDoc) {
        const allowedStatuses = ['draft', 'rejected'];
        if (!allowedStatuses.includes(originalDoc.status)) {
          return next(new Error('Representative can only edit draft or rejected orders'));
        }
        
        // Nếu đang chuyển từ rejected về draft, xóa approval_by
        if (originalDoc.status === 'rejected' && this.status === 'draft') {
          this.approval_by = undefined;
        }
      }
    }
  }
  next();
});

module.exports = mongoose.model("ExportOrder", exportOrderSchema)
