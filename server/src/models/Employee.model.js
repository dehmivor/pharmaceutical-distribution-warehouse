const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ tên không được để trống'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      required: [true, 'SDT không được để trống'],
      trim: true,
      match: [/^\d{10}$/, 'SDT phải có 10 ký tự'],
    },
    role: {
      type: String,
      enum: ['warehouse', 'supervisor'],
      default: 'warehouse',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
