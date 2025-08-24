const LogLocationChange = require('../models/LogLocationChange');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Package = require('../models/Package');

const { getBatchById } = require('./batchService');

/**
 * Log Location Change Service
 *
 * IMPROVEMENTS MADE:
 * 1. Fixed missing validation in logChange function
 * 2. Enhanced filter logic with proper array handling for warehouseId
 * 3. Improved date range filtering with proper time boundaries
 * 4. Added pagination parameter validation and sanitization
 * 5. Enhanced error handling and logging throughout the service
 * 6. Added proper null filtering for processed documents
 * 7. Improved batch information fetching with error handling
 */

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

    // Location filter
    if (locationId) {
      query.location_id = locationId;
    }

    // Batch filter
    if (batchId) {
      query.batch_id = batchId;
    }

    // Warehouse user filter (can be array for localPart search)
    if (warehouseId) {
      if (Array.isArray(warehouseId)) {
        query.ware_house_id = { $in: warehouseId };
      } else {
        query.ware_house_id = warehouseId;
      }
    }

    // Order filter - search across all order types
    if (order) {
      query.$or = [
        { import_order_id: order },
        { export_order_id: order },
        { inventory_check_order_id: order },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.updated_at = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Start of day
        query.updated_at.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        query.updated_at.$lte = end;
      }
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (validatedPage - 1) * validatedLimit;

    console.log('🔍 Log query filters:', query);
    console.log('🔍 Pagination:', { page: validatedPage, limit: validatedLimit, skip });

    const [total, docs] = await Promise.all([
      LogLocationChange.countDocuments(query),
      LogLocationChange.find(query)
        .sort({ updated_at: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate({
          path: 'location_id',
          select: 'bay row column',
          populate: { path: 'area_id', model: 'Area', select: 'name' },
        })
        .populate({ path: 'ware_house_id', select: '_id email' })
        .lean(),
    ]);

    const pages = Math.ceil(total / validatedLimit);

    console.log('🔍 Found logs:', docs.length, 'Total:', total, 'Pages:', pages);

    // Now enrich each doc with full batch details from getBatchById
    const data = await Promise.all(
      docs.map(async (doc) => {
        try {
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
          } catch (batchError) {
            console.warn('⚠️ Error fetching batch info:', doc.batch_id, batchError);
            // if batch not found or error, leave as null
          }

          return {
            ...doc,
            location: locationString,
            user: doc.ware_house_id, // { _id, email }
            batch, // full batch with populated medicine_id
          };
        } catch (docError) {
          console.warn('⚠️ Error processing log document:', doc._id, docError);
          return null;
        }
      }),
    );

    // Filter out null documents
    const validData = data.filter((doc) => doc !== null);

    return {
      total,
      pages,
      page: validatedPage,
      limit: validatedLimit,
      data: validData,
    };
  },

  getHistoryLast6MonthsByLicenseCode: async (licenseCode) => {
    if (!licenseCode) {
      const err = new Error('licenseCode is required');
      err.status = 400;
      throw err;
    }

    // 1) find medicine
    const med = await Medicine.findOne({ license_code: licenseCode.trim() }).select('_id').exec();
    if (!med) {
      const err = new Error('Medicine not found');
      err.status = 404;
      throw err;
    }

    const now = new Date();
    // start = first day of month 5 months ago (total 6 months incl. current)
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

    // build months array (oldest -> newest)
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1, 0, 0, 0, 0);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      months.push({ key, start: d });
    }
    const monthIndex = months.reduce((acc, m, i) => {
      acc[m.key] = i;
      return acc;
    }, {});

    // 2) compute current total quantity of medicine across all packages (no contract filter)
    // Aggregate: lookup batches -> match batch.medicine_id -> sum package.quantity
    const pipeline = [
      {
        $lookup: {
          from: 'batches',
          localField: 'batch_id',
          foreignField: '_id',
          as: 'batch',
        },
      },
      { $unwind: '$batch' },
      { $match: { 'batch.medicine_id': med._id } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$quantity', 0] } },
        },
      },
    ];

    const agg = await Package.aggregate(pipeline).exec();
    const currentTotal = agg[0] && agg[0].total ? agg[0].total : 0;

    // 3) get all batches of medicine
    const batches = await Batch.find({ medicine_id: med._id }).select('_id').lean().exec();
    const batchIds = batches.map((b) => b._id);
    if (batchIds.length === 0) {
      return {
        contracted_order: Array(6).fill(currentTotal || 0),
        months: months.map((m) => toShortMonth(m.key)),
      };
    }

    // 4) fetch logs for those batches in window, sorted oldest->newest
    const logs = await LogLocationChange.find({
      batch_id: { $in: batchIds },
      updated_at: { $gte: startMonth, $lte: now },
    })
      .sort({ updated_at: 1 })
      .lean()
      .exec();

    // 5) compute net change per month (all logs, no checking)
    const netChange = Array(6).fill(0);
    for (const l of logs) {
      const dt = l.updated_at;
      if (!dt) continue;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthIndex[key];
      if (typeof idx !== 'number') continue;
      const q = Number(l.quantity || 0);
      const signed = l.type === 'add' ? q : -q;
      netChange[idx] += signed;
    }

    // 6) reverse from currentTotal to compute balances oldest -> newest
    const balances = Array(6).fill(0);
    const last = 5;
    balances[last] = currentTotal || 0;
    for (let i = last - 1; i >= 0; i--) {
      balances[i] = balances[i + 1] - netChange[i + 1];
    }

    return {
      contracted_order: balances,
      months: months.map((m) => toShortMonth(m.key)),
    };
  },
};

module.exports = logLocationChangeService;
