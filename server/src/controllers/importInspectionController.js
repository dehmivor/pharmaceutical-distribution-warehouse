const ImportInspection = require('../models/ImportInspection');

// Lấy danh sách các thùng theo batch_id
exports.getByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const inspections = await ImportInspection.find({ batch_id: batchId })
      .populate('import_order_id')
      .populate({
        path: 'batch_id',
        populate: { path: 'medicine_id' },
      })
      .populate('created_by');
    res.json(inspections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params; // id của import inspection (thùng)
    const { location } = req.body; // location là string hoặc object tùy bạn thiết kế

    const updated = await ImportInspection.findByIdAndUpdate(id, { location }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
