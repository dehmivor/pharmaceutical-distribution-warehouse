const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        row: {
            type: String,
            required: [true, 'Row không được để trống'],
            trim: true,
        },
        bay: {
            type: String,
            required: [true, 'Bay không được để trống'],
            trim: true,
        },
        level: {
            type: String,
            required: [true, 'Level không được để trống'],
            trim: true,
        },
        area: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Area',
            required: [true, 'Area không được để trống'],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
