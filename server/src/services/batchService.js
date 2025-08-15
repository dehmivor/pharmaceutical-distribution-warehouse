const Batch = require('../models/Batch');

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


module.exports = {
  getValidBatches,
  getBatchById,
};