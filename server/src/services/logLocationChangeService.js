const LogLocationChange = require('../models/LogLocationChange');
const { getBatchById } = require('./batchService');


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
        order,
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
                .populate({
                    path: 'location_id',
                    select: 'bay row column',
                    populate: { path: 'area_id', model: 'Area', select: 'name' }
                })
                .populate({ path: 'ware_house_id', select: '_id email' })
                .lean(),
        ]);

        const pages = Math.ceil(total / limit);

        // Now enrich each doc with full batch details from getBatchById
        const data = await Promise.all(docs.map(async doc => {
            // build location string
            let locationString = '';
            if (doc.location_id?.area_id) {
                const { name } = doc.location_id.area_id;
                const { bay, row, column } = doc.location_id;
                locationString = `${name}-B:${bay}-R:${row}-C:${column}`;
            }

            // fetch batch info
            let batch = null;
            try {
                batch = await getBatchById(doc.batch_id);
            } catch {
                // if batch not found or error, leave as null
            }

            return {
                ...doc,
                location: locationString,
                user: doc.ware_house_id, // { _id, email }
                batch,                       // full batch with populated medicine_id
            };
        }));

        return { total, pages, page, limit, data };
    }

}

module.exports = logLocationChangeService