const logLocationChangeService = require('../services/logLocationChangeService');
const userService = require('../services/userService');
const locationService = require('../services/locationService');


const toShortMonth = (ym) => {
  if (typeof ym !== 'string') return ym;
  const m = /^\s*(\d{4})-(\d{1,2})\s*$/.exec(ym);
  if (m) {
    const yy = m[1].slice(-2);
    const mm = m[2].padStart(2, '0');
    return `${yy}-${mm}`;
  }
  const parts = ym.split('-');
  if (parts.length >= 2) {
    const y = parts[0];
    const yy = y.length === 4 ? y.slice(-2) : y;
    const mm = parts[1].padStart(2, '0');
    return `${yy}-${mm}`;
  }
  return ym;
};

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
    },

    getHistoryLast6Months: async (req, res) => {
        try {
            const licenseCode = (req.params.license_code || '').trim();
            if (!licenseCode) {
                return res.status(400).json({ success: false, error: 'license_code is required' });
            }
            const data = await logLocationChangeService.getHistoryLast6MonthsByLicenseCode(licenseCode);

            // Return in requested format:
            // { contracted_order: [...], months: [...] }
            return res.json({
                success: true,
                meta: {
                    medicine_license_code: licenseCode,
                },
                data: {
                    quantity: data.contracted_order,
                    months: data.months,
                },
            });
        } catch (err) {
            if (err && err.status === 404) {
                return res.status(404).json({ success: false, error: err.message || 'Not found' });
            }

            console.error('medicineHistoryController.getHistoryLast6Months error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

}

module.exports = logLocationChangeController;