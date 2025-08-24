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
      console.log('🔍 getLogLocationChanges called with query:', req.query);

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
          console.log('🔍 Resolving location coordinates:', { areaId, bay, row, column });
          const loc = await locationService.getLocationByCoordinates(areaId, bay, row, column);
          if (!loc) {
            console.log('🔍 No location found for coordinates');
            // no such location → empty result
            return res.json({
              success: true,
              total: 0,
              pages: 0,
              page: parseInt(page, 10),
              limit: parseInt(limit, 10),
              data: [],
            });
          }
          locationId = loc._id.toString();
          console.log('🔍 Resolved locationId:', locationId);
        } catch (err) {
          console.warn('⚠️ Error resolving location coordinates:', err);
          // validation error from service
          return res.status(400).json({ success: false, error: err.message });
        }
      }

      // 3) If localPart is provided, resolve to user IDs
      if (localPart) {
        try {
          console.log('🔍 Searching for users with localPart:', localPart);
          const users = await userService.findUsersByEmailLocal(localPart);
          const userIds = users.map((u) => u._id.toString());
          console.log('🔍 Found users:', userIds.length);

          if (userIds.length === 0) {
            console.log('🔍 No users found for localPart');
            return res.json({
              success: true,
              total: 0,
              pages: 0,
              page: parseInt(page, 10),
              limit: parseInt(limit, 10),
              data: [],
            });
          }
          warehouseId = userIds;
        } catch (err) {
          console.warn('⚠️ Error searching for users:', err);
          return res.status(500).json({ success: false, error: 'Error searching for users' });
        }
      }

      // 4) Validate and sanitize parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

      // 5) Fetch paginated & filtered logs
      console.log('🔍 Calling service with filters:', {
        locationId,
        batchId,
        order,
        warehouseId,
        startDate,
        endDate,
        page: validatedPage,
        limit: validatedLimit,
      });

      const result = await logLocationChangeService.getLogLocationChange({
        locationId,
        batchId,
        order,
        warehouseId,
        startDate,
        endDate,
        page: validatedPage,
        limit: validatedLimit,
      });

      console.log('🔍 Service returned:', {
        total: result.total,
        pages: result.pages,
        dataCount: result.data.length,
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('❌ Error fetching log location changes:', err);
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
  },
};

module.exports = logLocationChangeController;
