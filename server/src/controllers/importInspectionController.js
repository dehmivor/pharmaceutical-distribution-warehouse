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
}

module.exports = packageController