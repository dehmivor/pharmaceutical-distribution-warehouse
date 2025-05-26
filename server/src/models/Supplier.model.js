const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên NSX không được để trống'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Nơi NSX không được để trống'],
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
            match: [/^\d{10}$/, 'SDT phải có 10 ký tự'],
        },
        license: {
            type: String,
            required: [true, 'Giấy phép NSX không được để trống'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['operational', 'suspended'],
            default: 'operational',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
