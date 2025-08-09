const mongoose = require('mongoose');
const { importOrderDetailsSchema } = require('./subSchemas');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

const importOrderSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: false,
    },
    warehouse_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(IMPORT_ORDER_STATUSES),
        message: `Status must be one of: ${Object.values(IMPORT_ORDER_STATUSES).join(', ')}`,
      },
      default: IMPORT_ORDER_STATUSES.DRAFT,
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
    details: [importOrderDetailsSchema],
  },
  {
    timestamps: true,
  },
);

// Validation: Kiểm tra trùng thuốc trong details
importOrderSchema.pre('save', function (next) {
  if (this.details && this.details.length > 0) {
    const medicineIds = this.details.map((detail) => detail.medicine_id.toString());
    const uniqueMedicineIds = [...new Set(medicineIds)];

    if (medicineIds.length !== uniqueMedicineIds.length) {
      return next(new Error('Duplicate medicines are not allowed in import order'));
    }
  }
  next();
});

// Validation: Kiểm tra số lượng từ contract
importOrderSchema.pre('save', async function (next) {
  if (this.details && this.details.length > 0 && this.contract_id) {
    try {
      const Contract = mongoose.model('Contract');
      const contract = await Contract.findById(this.contract_id);

      if (!contract) {
        return next(new Error('Contract not found'));
      }

      // Chỉ validate cho contract với partner_type là 'Supplier'
      if (contract.partner_type !== 'Supplier') {
        return next(new Error('Import orders can only be created for supplier contracts'));
      }

      // Kiểm tra từng detail với contract
      for (const detail of this.details) {
        const contractItem = contract.items.find(
          (item) => item.medicine_id.toString() === detail.medicine_id.toString(),
        );

        if (contractItem) {
          if (detail.quantity < contractItem.min_order_quantity) {
            return next(
              new Error(
                `Quantity for medicine ${detail.medicine_id} must be at least ${contractItem.min_order_quantity} (minimum order quantity from contract)`,
              ),
            );
          }
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Validation: Khóa edit sau khi chuyển thành delivered
importOrderSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    // Lấy trạng thái hiện tại từ database hoặc từ _original
    const currentStatus = this._original?.status || this.status;

    // Kiểm tra nếu đang cố gắng sửa order đã được delivered trở lên
    if (
      currentStatus === 'checked' ||
      currentStatus === 'arranged' ||
      currentStatus === 'completed'
    ) {
      return next(new Error('Cannot edit import order after it has been delivered'));
    }
  }
  next();
});

// Validation: Role-based permissions - Representative chỉ có thể edit draft orders
importOrderSchema.pre('save', function (next) {
  // Chỉ áp dụng validation này khi có thông tin user context
  if (this._userContext) {
    const userRole = this._userContext.role;
    const isNewOrder = this.isNew;

    // Warehouse Manager có thể tạo đơn nội bộ với status delivered
    if (userRole === 'warehouse_manager' && isNewOrder && !this.contract_id && this.status === 'delivered') {
      // Đảm bảo warehouse_manager_id được set cho đơn nội bộ
      if (!this.warehouse_manager_id) {
        this.warehouse_manager_id = this._userContext.id || this._userContext._id;
      }
      return next(); // Cho phép warehouse manager tạo đơn nội bộ
    }

    // Representative chỉ có thể tạo mới hoặc edit draft hoặc rejected orders
    if (userRole === 'representative') {
      if (!isNewOrder && this.status !== 'draft' && this.status !== 'rejected') {
        return next(new Error('Representative can only edit draft or rejected orders'));
      }
    }

    // Representative Manager chỉ có thể edit draft orders
    if (userRole === 'representative_manager') {
      if (!isNewOrder && this.status !== 'draft') {
        return next(new Error('Representative Manager can only edit draft orders'));
      }
    }
  }
  next();
});

// Validation: Kiểm tra status transitions
importOrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const validTransitions = {
      draft: ['approved', 'cancelled'],
      approved: ['draft', 'delivered', 'cancelled'],
      delivered: ['approved', 'checked', 'cancelled'],
      checked: ['delivered', 'arranged', 'cancelled'],
      arranged: ['checked', 'completed', 'cancelled'],
      completed: [],
      cancelled: [],
      // Cho phép chuyển từ rejected về draft nếu là representative
      rejected: ['draft'],
    };

    const currentStatus = this._original?.status || 'draft';
    const newStatus = this.status;

    // Warehouse Manager có thể tạo đơn nội bộ với status delivered
    if (
      this._userContext &&
      this._userContext.role === 'warehouse_manager' &&
      this.isNew &&
      !this.contract_id &&
      newStatus === 'delivered'
    ) {
      // Đảm bảo warehouse_manager_id được set cho đơn nội bộ
      if (!this.warehouse_manager_id) {
        this.warehouse_manager_id = this._userContext.id || this._userContext._id;
      }
      return next(); // Cho phép warehouse manager tạo đơn nội bộ
    }

    // Nếu là representative và chuyển từ rejected về draft thì cho phép
    if (
      this._userContext &&
      this._userContext.role === 'representative' &&
      currentStatus === 'rejected' &&
      newStatus === 'draft'
    ) {
      return next();
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return next(new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`));
    }
  }
  next();
});

// Static method để test validation
importOrderSchema.statics.validateImportOrder = async function (orderData, userContext = null) {
  const testOrder = new this(orderData);

  if (userContext) {
    testOrder._userContext = userContext;
  }

  try {
    await testOrder.validate();
    return { isValid: true };
  } catch (error) {
    return { isValid: false, errors: error.errors };
  }
};

module.exports = mongoose.model('ImportOrder', importOrderSchema);
