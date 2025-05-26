const express = require('express');
const mongoose = require('mongoose');
const Destroy = require('../../models/destroy.model');

const router = express.Router();

// Middleware kiểm tra ID hợp lệ
const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID không hợp lệ' });
  }
  next();
};

// Tạo phiếu báo hủy
router.post('/destroy', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Body yêu cầu không được để trống' });
    }

    const { drugName, lotNumber, quantity, reason, notes } = req.body;
    if (!drugName || !lotNumber || !quantity || !reason) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    console.log('Dữ liệu trước khi lưu:', { drugName, lotNumber, quantity, reason, notes });
    const newDestroy = new Destroy({
      drugName,
      lotNumber,
      quantity,
      reason,
      notes,
    });
    await newDestroy.save();
    console.log('Dữ liệu đã lưu:', newDestroy);

    res.status(201).json({ message: 'Phiếu báo hủy được tạo thành công', data: newDestroy });
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo phiếu báo hủy', error: error.message });
  }
});

// Lấy danh sách tất cả phiếu báo hủy
router.get('/destroy', async (req, res) => {
  try {
    const destroyList = await Destroy.find().sort({ disposed_at: -1 });
    res.status(200).json(destroyList);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phiếu báo hủy', error: error.message });
  }
});

// Lấy thông tin phiếu báo hủy theo ID
router.get('/destroy/:id', validateId, async (req, res) => {
  try {
    const destroy = await Destroy.findById(req.params.id);
    if (!destroy) {
      return res.status(404).json({ message: 'Phiếu báo hủy không tồn tại' });
    }
    res.status(200).json(destroy);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy phiếu báo hủy', error: error.message });
  }
});

// Cập nhật thông tin phiếu báo hủy
router.put('/destroy/:id', validateId, async (req, res) => {
  try {
    const { approved_by, status } = req.body;
    const destroy = await Destroy.findById(req.params.id);
    if (!destroy) {
      return res.status(404).json({ message: 'Phiếu báo hủy không tồn tại' });
    }

    const updateData = { approved_by, approved_at: status === 'Approved' ? Date.now() : undefined, status };
    const updatedDestroy = await Destroy.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.status(200).json({ message: 'Phiếu báo hủy được cập nhật', data: updatedDestroy });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật phiếu báo hủy', error: error.message });
  }
});

// Xóa phiếu báo hủy
router.delete('/destroy/:id', validateId, async (req, res) => {
  try {
    const destroy = await Destroy.findById(req.params.id);
    if (!destroy) {
      return res.status(404).json({ message: 'Phiếu báo hủy không tồn tại' });
    }

    await Destroy.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Phiếu báo hủy đã bị xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa phiếu báo hủy', error: error.message });
  }
});

module.exports = router;