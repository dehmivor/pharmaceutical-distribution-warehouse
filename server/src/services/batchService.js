const Batch = require('../models/Batch');

const getValidBatches = async (medicineId) => {
  const today = new Date();

  const batches = await Batch.find({
    medicine_id: medicineId,
    expiry_date: { $gt: today },
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

module.exports = {
  getValidBatches,
};