const logLocationChangeService = require('../services/logLocationChangeService');
const userService = require('../services/userService');
const locationService = require('../services/locationService');


const logLocationChangeController = {

    getLogLocationChanges: async (req, res) => {
        try {
            // 1) Extract localPart and location filter parts from query
            const { localPart, areaId, bay, row, column } = req.query;
            let {
                page = 1,
                limit = 20,
                locationId,
                batchId,
                order,
                warehouseId,
                startDate,
                endDate,
            } = req.query;

            // 2) If areaId+bay+row+column are provided, resolve to a single locationId
            if (areaId && bay && row && column) {
                try {
                    const loc = await locationService.getLocationByCoordinates(
                        areaId, bay, row, column
                    );
                    if (!loc) {
                        // no such location → empty result
                        return res.json({
                            success: true,
                            total: 0,
                            pages: 0,
                            page: parseInt(page, 10),
                            limit: parseInt(limit, 10),
                            data: []
                        });
                    }
                    locationId = loc._id.toString();
                } catch (err) {
                    // validation error from service
                    return res.status(400).json({ success: false, error: err.message });
                }
            }

            // 3) If localPart is provided, resolve to user IDs
            if (localPart) {
                const users = await userService.findUsersByEmailLocal(localPart);
                const userIds = users.map(u => u._id.toString());
                if (userIds.length === 0) {
                    return res.json({
                        success: true,
                        total: 0,
                        pages: 0,
                        page: parseInt(page, 10),
                        limit: parseInt(limit, 10),
                        data: []
                    });
                }
                warehouseId = userIds;
            }

            // 4) Fetch paginated & filtered logs
            const result = await logLocationChangeService.getLogLocationChange({
                locationId,
                batchId,
                order,
                warehouseId,
                startDate,
                endDate,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            });

            return res.json({ success: true, ...result });
        } catch (err) {
            console.error('Error fetching log location changes:', err);
            return res.status(500).json({ success: false, error: 'Server error' });
        }
    }

}

module.exports = logLocationChangeController;