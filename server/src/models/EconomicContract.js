const mongoose = require('mongoose');
const { itemEconomicContractSchema } = require('./subSchemas');
const { CONTRACT_STATUSES, PARTNER_TYPES } = require('../utils/constants');

const economicContractSchema = new mongoose.Schema({
  contract_code: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'Contract code is required'],
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Representative ID is required'],
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'partner_type', // Dynamic reference to Supplier or Retailer
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
  },
  items: [itemEconomicContractSchema], // Yêu cầu số lượng cụ thể
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

module.exports = mongoose.model('EconomicContract', economicContractSchema);