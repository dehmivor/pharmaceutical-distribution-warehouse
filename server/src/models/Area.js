const mongoose = require('mongoose');
const { storageConditionsSchema } = require('./subSchemas');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Area name is required'],
    trim: true,
  },
  storage_conditions: {
    type: storageConditionsSchema,
    required: [true, 'Storage conditions are required'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
}, {
});

// Thêm index để tối ưu truy vấn
areaSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Area', areaSchema);