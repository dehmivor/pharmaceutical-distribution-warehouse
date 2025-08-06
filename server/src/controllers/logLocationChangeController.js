const logLocationChangeService = require('../services/logLocationChangeService')


const logLocationChangeController = {

    getLogLocationChanges: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                locationId,
                batchId,
                order,           // new single param
                warehouseId,
                startDate,
                endDate,
            } = req.query;

            const result = await logLocationChangeService.getLogLocationChange({
                locationId,
                batchId,
                order,          // pass through
                warehouseId,
                startDate,
                endDate,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            });

            res.json({ success: true, ...result });
        } catch (err) {
            console.error('Error fetching log location changes:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    }

}

module.exports = logLocationChangeController;