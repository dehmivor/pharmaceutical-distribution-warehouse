const mongoose = require("mongoose");
const { INVENTORY_CHECK_INSPECTION_STATUSES } = require("../utils/constants");

const inventoryCheckInspectionSchema = new mongoose.Schema({
    inventory_check_order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InventoryCheckOrder",
        required: [true, "Inventory check order ID is required"],
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: {
            values: Object.values(INVENTORY_CHECK_INSPECTION_STATUSES),
            message: `Status must be one of: ${Object.values(INVENTORY_CHECK_INSPECTION_STATUSES).join(", ")}`,
        },
        default: INVENTORY_CHECK_INSPECTION_STATUSES.PENDING,
    },
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required: [true, "Medicine ID is required"],
    },
    expected_quantity: {
        type: Number,
        required: [true, "Expected quantity is required"],
        min: [1, "Expected quantity must be greater than 0"],
    },
    actual_quantity: {
        type: Number,
        required: [true, "Actual quantity is required"],
        min: [0, "Actual quantity must be greater than 0"],
    },
    notes: {
        type: String,
    },
    check_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Check by is required"],
    }
});

module.exports = mongoose.model("InventoryCheckInspection", inventoryCheckInspectionSchema);