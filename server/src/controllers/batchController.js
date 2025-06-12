const Batch = require('../models/Batch');
const Location = require('../models/Location');

exports.assignBatch = async (req, res) => {
  const { locationId, batchCode, quantity } = req.body;
  try {
    const location = await Location.findById(locationId);
    if (!location || !location.available) {
      return res.status(400).json({ message: 'Location not available' });
    }
    const batch = await Batch.findOneAndUpdate(
      { batch_code: batchCode },
      { $inc: { quantity: quantity } },
      { new: true, upsert: true }
    );
    location.available = false;
    await location.save();
    res.json({ message: 'Batch assigned successfully', batch, location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkCapacity = async (req, res) => {
  const { orderId, quantity } = req.body;
  try {
    const totalCapacity = await Location.aggregate([
      { $group: { _id: null, totalArea: { $sum: { $multiply: ['$capacity.length', '$capacity.width'] } } } }
    ]);
    const usedCapacity = await Location.aggregate([
      { $match: { available: false } },
      { $group: { _id: null, usedArea: { $sum: { $multiply: ['$capacity.length', '$capacity.width'] } } } }
    ]);
    const availableCapacity = (totalCapacity[0]?.totalArea || 0) - (usedCapacity[0]?.usedArea || 0);
    const requiredCapacity = quantity * 0.1; // Giả định mỗi đơn vị hàng chiếm 0.1 đơn vị diện tích

    if (requiredCapacity <= availableCapacity) {
      res.json({ message: `Sufficient capacity. Available: ${availableCapacity}, Required: ${requiredCapacity}. Approved at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}` });
    } else {
      res.json({ message: `Insufficient capacity. Available: ${availableCapacity}, Required: ${requiredCapacity}. Not approved.` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};