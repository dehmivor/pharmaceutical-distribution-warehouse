const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
    {
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location không được để trống'],
        },
        quantity: {
            type: Number,
            required: [true, 'Package quantity không được để trống'],
        },
        content: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: [true, 'nội dung package không được để trống'],
        }
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
