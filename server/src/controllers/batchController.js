const Batch = require('../models/Batch');
const Location = require('../models/Location');



const batchController = {

  assignBatch: async (req, res) => {
    const { locationId, batchCode, quantity } = req.body;
    try {
      const location = await Location.findById(locationId);
      if (!location || !location.available) {
        return res.status(400).json({ message: 'Location not available' });
      }
      const batch = await Batch.findOneAndUpdate(
        { batch_code: batchCode },
        { $inc: { quantity: quantity } },
        { new: true, upsert: true },
      );
      location.available = false;
      await location.save();
      res.json({ message: 'Batch assigned successfully', batch, location });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  checkCapacity: async (req, res) => {
    const { orderId, quantity } = req.body;
    try {
      const totalCapacity = await Location.aggregate([
        {
          $group: {
            _id: null,
            totalArea: { $sum: { $multiply: ['$capacity.length', '$capacity.width'] } },
          },
        },
      ]);
      const usedCapacity = await Location.aggregate([
        { $match: { available: false } },
        {
          $group: {
            _id: null,
            usedArea: { $sum: { $multiply: ['$capacity.length', '$capacity.width'] } },
          },
        },
      ]);
      const availableCapacity = (totalCapacity[0]?.totalArea || 0) - (usedCapacity[0]?.usedArea || 0);
      const requiredCapacity = quantity * 0.1; // Giả định mỗi đơn vị hàng chiếm 0.1 đơn vị diện tích

      if (requiredCapacity <= availableCapacity) {
        res.json({
          message: `Sufficient capacity. Available: ${availableCapacity}, Required: ${requiredCapacity}. Approved at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
        });
      } else {
        res.json({
          message: `Insufficient capacity. Available: ${availableCapacity}, Required: ${requiredCapacity}. Not approved.`,
        });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const batches = await Batch.find().populate('medicine_id');
      res.json(batches);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  createBatch: async (req, res) => {
    try {
      const {
        medicine_id,
        batch_code,
        production_date,
        expiry_date,
        supplier_id
      } = req.body;

      // 1) Validate presence
      if (!medicine_id || !batch_code || !production_date || !expiry_date || !supplier_id) {
        return res.status(400).json({
          success: false,
          message: 'medicine_id, batch_code, production_date, expiry_date, and supplier_id are all required'
        });
      }

      // 2) Create the batch
      const batch = await Batch.create({
        medicine_id,
        batch_code,
        production_date,
        expiry_date,
        supplier_id
      });

      return res.status(201).json({
        success: true,
        data: batch
      });
    } catch (err) {
      console.error('❌ Error creating batch:', err);
      // 3) Handle unique index error on batch_code
      if (err.code === 11000 && err.keyPattern && err.keyPattern.batch_code) {
        return res.status(409).json({
          success: false,
          message: `Batch code "${err.keyValue.batch_code}" already exists`
        });
      }
      // 4) Validation error?
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages
        });
      }
      // 5) Other server error
      return res.status(500).json({
        success: false,
        message: 'Server error creating batch'
      });
    }
  }

}

module.exports = batchController;

