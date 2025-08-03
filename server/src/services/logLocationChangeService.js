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
    }

}

module.exports = logLocationChangeService