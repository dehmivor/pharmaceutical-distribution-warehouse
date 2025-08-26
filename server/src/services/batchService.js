const Batch = require('../models/Batch');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getValidBatches = async (medicineId) => {
  if (!medicineId) throw new Error('medicineId is required');

  // compute date one year from today
  const minExpiry = new Date();
  minExpiry.setFullYear(minExpiry.getFullYear() + 1);

  const batches = await Batch.find({
    medicine_id: medicineId,
    expiry_date: { $gte: minExpiry }, // only batches expiring >= 1 year from now
  })
    .populate({
      path: 'medicine_id',
      select: 'medicine_name license_code',
    })
    // sort expiry_date ascending: closest → furthest
    .sort({ expiry_date: 1 })
    .exec();

  return batches;
};

const getBatchById = async (batchId) => {
  if (!batchId) {
    const err = new Error('batchId is required');
    err.statusCode = 400;
    throw err;
  }
  const batch = await Batch.findById(batchId)
    .populate({
      path: 'medicine_id',
      select: '_id medicine_name license_code'
    })
    .select('-quality_status -createdAt -updatedAt -__v')
    .lean();

  if (!batch) {
    const err = new Error(`Batch ${batchId} not found`);
    err.statusCode = 404;
    throw err;
  }

  return batch;
}


const isBatchCodeUnique = async(batchCode, opts = {}) => {
  if (!batchCode || typeof batchCode !== 'string') {
    const err = new Error('batchCode is required and must be a string');
    err.status = 400;
    throw err;
  }

  const code = batchCode.trim();
  if (code.length === 0) {
    const err = new Error('batchCode cannot be empty after trimming');
    err.status = 400;
    throw err;
  }

  const query = {
    batch_code: { $regex: `^${escapeRegex(code)}$`, $options: 'i' }, // exact match, case-insensitive
  };

  if (opts.excludeId) {
    query._id = { $ne: opts.excludeId };
  }

  const existing = await Batch.findOne(query).select('_id').lean().exec();
  return !existing; // true = unique, false = already exists
}

module.exports = {
  isBatchCodeUnique,
};



module.exports = {
  getValidBatches,
  getBatchById,
  isBatchCodeUnique
};