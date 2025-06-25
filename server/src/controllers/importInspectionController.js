const ImportOrder = require("../models/ImportOrder")
const ImportInspection = require("../models/ImportInspection")
const Batch = require("../models/Batch")
const Medicine = require("../models/Medicine")
const mongoose = require("mongoose")

const packageController = {

  // Get packages by location
  getInspectionByImportOrder: async (req, res) => {
    try {
      const { importOrderId } = req.params;

      const inspections = await ImportInspection.find({ import_order_id: importOrderId })
        .populate({
          path: 'batch_id',
          select: '-createdAt -updatedAt -production_date -expiry_date',
          populate: [
            {
              path: 'supplier_id',
              select: 'name'
            },
            {
              path: 'medicine_id',
              select: 'name'
            }
          ]
        })
        .sort({ _id: -1 });

      res.status(200).json({ inspections });
    } catch (error) {
      console.error('Error fetching import inspections:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching import order inspections',
        error: error.message,
      });
    }
  },

  // Lấy danh sách các thùng theo batch_id
  getByBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      const inspections = await ImportInspection.find({ batch_id: batchId })
        .populate('import_order_id')
        .populate({
          path: 'batch_id',
          populate: { path: 'medicine_id' }
        })
        .populate('created_by');
      res.json(inspections);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateLocation: async (req, res) => {
    try {
      const { id } = req.params; // id của import inspection (thùng)
      const { location } = req.body; // location là string hoặc object tùy bạn thiết kế

      const updated = await ImportInspection.findByIdAndUpdate(
        id,
        { location },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = packageController



