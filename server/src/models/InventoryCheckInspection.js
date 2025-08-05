const mongoose = require('mongoose');
const { INVENTORY_CHECK_INSPECTION_STATUSES } = require('../utils/constants');
const { checkItemSchema } = require('./subSchemas');

const inventoryCheckInspectionSchema = new mongoose.Schema({
  inventory_check_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCheckOrder',
    required: [true, 'Inventory check order ID is required'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(INVENTORY_CHECK_INSPECTION_STATUSES),
      message: `Status must be one of: ${Object.values(INVENTORY_CHECK_INSPECTION_STATUSES).join(', ')}`,
    },
    default: INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT,
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required'],
  },
  check_list: [checkItemSchema],
  notes: {
    type: String,
  },
  check_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [false, 'Check by is required'],
  },
});

module.exports = mongoose.model('InventoryCheckInspection', inventoryCheckInspectionSchema);
