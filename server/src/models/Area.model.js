const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên area không được để trống'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['normal', 'cold_storage'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
