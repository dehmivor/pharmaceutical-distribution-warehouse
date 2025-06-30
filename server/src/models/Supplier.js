const mongoose = require('mongoose');
const constants = require('../utils/constants');
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  license: {
    type: String,
    required: [true, 'Supplier license number is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: {
      values: Object.values(constants.USER_STATUSES),
      message: `Status must be one of: ${Object.values(constants.USER_STATUSES).join(', ')}`,
    },
    default: constants.USER_STATUSES.ACTIVE,
  },
});

module.exports = mongoose.model('Supplier', supplierSchema);
