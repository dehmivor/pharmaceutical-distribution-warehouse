const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        batchNumber: {
            type: Number,
            unique: true,
            required: [true, 'số lô không được để trống'],
        },
        expiryDate: {
            type: Date,
            required: [true, 'HSD không được để trống'],
        },
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: [true, 'nội dung lô không được để trống'],
        }
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
