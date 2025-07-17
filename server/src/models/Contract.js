const mongoose = require('mongoose');
const { itemContractSchema, annexSchema } = require('./subSchemas');
const { CONTRACT_STATUSES, PARTNER_TYPES, CONTRACT_TYPES } = require('../utils/constants');

// Schema chính cho hợp đồng
const contractSchema = new mongoose.Schema({
  contract_code: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'Contract code is required'],
  },
  contract_type: {
    type: String,
    required: [true, 'Contract type is required'],
    enum: {
      values: Object.values(CONTRACT_TYPES),
      message: `Contract type must be one of: ${Object.values(CONTRACT_TYPES).join(', ')}`,
    },
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Representative ID is required'],
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'partner_type',
    required: [true, 'Partner ID is required'],
  },
  partner_type: {
    type: String,
    enum: {
      values: [PARTNER_TYPES.SUPPLIER, PARTNER_TYPES.RETAILER],
      message: `Partner type must be one of: ${Object.values(PARTNER_TYPES).join(', ')}`,
    },
    required: [true, 'Partner type is required'],
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function (value) {
        // Sử dụng this.start_date nếu có, nếu không thì lấy từ update data
        const startDate = this.start_date || (this._update && this._update.$set && this._update.$set.start_date);
        if (!startDate) {
          return true; // Skip validation if we can't determine start_date
        }
        return value >= startDate;
      },
      message: 'End date must be after start date',
    },
  },
  items: [itemContractSchema],
  annexes: {
    type: [annexSchema],
    default: [],
    validate: {
      validator: function (value) {
        return this.contract_type === CONTRACT_TYPES.PRINCIPAL || value.length === 0;
      },
      message: 'Annexes are only allowed for principal contracts',
    },
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(CONTRACT_STATUSES),
      message: `Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`,
    },
    default: CONTRACT_STATUSES.DRAFT,
  },
});

module.exports = mongoose.model('Contract', contractSchema);
