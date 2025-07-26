const mongoose = require("mongoose");
const { INVENTORY_CHECK_ORDER_STATUSES } = require("../utils/constants");

const inventoryCheckOrderSchema = new mongoose.Schema({
    warehouse_manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Warehouse manager ID is required"],
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Created by is required"],
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: {
        values: Object.values(INVENTORY_CHECK_ORDER_STATUSES),
        message: `Status must be one of: ${Object.values(INVENTORY_CHECK_ORDER_STATUSES).join(", ")}`,
        },
        default: INVENTORY_CHECK_ORDER_STATUSES.PENDING,
    },
    inventory_check_date: {
        type: Date,
        required: [true, "Inventory check date is required"],
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("InventoryCheckOrder", inventoryCheckOrderSchema);
