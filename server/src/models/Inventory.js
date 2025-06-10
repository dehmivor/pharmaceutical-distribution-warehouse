const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
});

inventorySchema.index({ medicine_id: 1, batch_id: 1, location_id: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);