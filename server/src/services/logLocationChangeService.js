const LogLocationChange = require('../models/LogLocationChange');


const logLocationChangeService = {

    logChange: async ({
        location_id,
        type,
        batch_id,
        quantity,
        ware_house_id,
        import_order_id,
        export_order_id,
        inventory_check_order_id,
    }) => {
        if (!location_id || !ware_house_id) {
            throw { status: 400, message: 'location_id and ware_house_id are required' };
        }

        const log = await LogLocationChange.create({
            location_id,
            type,
            batch_id,
            quantity,
            ware_house_id,
            import_order_id,
            export_order_id,
            inventory_check_order_id,
        });

        return log;
    },

    getLogLocationChange: async ({
        locationId,
        batchId,
        order,          // single order ID for import/export/inventory_check
        warehouseId,
        startDate,
        endDate,
        page = 1,
        limit = 20,
    }) => {
        const query = {};

        if (locationId) query.location_id = locationId;
        if (batchId) query.batch_id = batchId;
        if (warehouseId) query.ware_house_id = warehouseId;

        // Consolidated order filter
        if (order) {
            query.$or = [
                { import_order_id: order },
                { export_order_id: order },
                { inventory_check_order_id: order },
            ];
        }

        if (startDate || endDate) {
            query.updated_at = {};
            if (startDate) query.updated_at.$gte = new Date(startDate);
            if (endDate) query.updated_at.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const [total, docs] = await Promise.all([
            LogLocationChange.countDocuments(query),
            LogLocationChange.find(query)
                .sort({ updated_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        const pages = Math.ceil(total / limit);
        return { total, pages, page, limit, data: docs };
    }

}

module.exports = logLocationChangeService