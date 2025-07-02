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

// Cập nhật vị trí thùng
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const updated = await ImportInspection.findByIdAndUpdate(
      id,
      { location },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ error: 'Thùng nhập khẩu không tồn tại' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh sách inspection theo import_order_id
exports.getInspectionByImportOrder = async (req, res) => {
  try {
    const { importOrderId } = req.params;

    const inspections = await ImportInspection.find({ import_order_id: importOrderId })
      .populate({
        path: 'medicine_id',
        select: '-min_stock_threshold -max_stock_threshold',
      })
      .sort({ _id: -1 });

    res.status(200).json({ inspections });
  } catch (error) {
    console.error('Lỗi khi truy xuất dữ liệu kiểm tra:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy dữ liệu kiểm tra',
      error: error.message,
    });
  }
};
