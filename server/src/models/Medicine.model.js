const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên medicine không được để trống'],
            trim: true,
        },
        licenseNumber: {
            type: String,
            required: [true, 'license number không được để trống'],
            unique: true,
            trim: true,
        },
        manufacturer: {
            type: String,
            required: [true, 'NSX không được để trống'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['in_production', 'discontinued', 'suspended'],
            default: 'in_production',
        },
        quantity: {
            type: Number,
            required: [true, 'số lượng thuốc 1 hộp không được để trống'],
        },
        unit: {
            type: String,
            required: [true, 'đơn vị đo thuốc không được để trống'],
        },
        dosageForm: {
            type: String,
            required: [true, 'dạng bào chế không được để trống'],
        },
        retailPrice: {
            type: Number,
            required: [true, 'giá bán lẻ không được để trống'],
        },
        wholesalePrice: {
            type: Number,
            required: [true, 'giá bán buôn không được để trống'],
        },
        group: {
            type: String,
            enum: ['group_1', 'group_2'],
            default: 'group_1',
        },
        mainIngredient: [
            {
                ingredient: {
                    type: String,
                    required: [true, 'hoạt chất không được để trống'],
                },
                amount: {
                    type: String,
                    required: [true, 'hàm lượng không được để trống'],
                }
            }
        ],
        supplier: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Supplier',
            },
        ]
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
