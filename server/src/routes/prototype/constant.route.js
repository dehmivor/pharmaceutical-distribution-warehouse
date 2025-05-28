const express = require('express');
const router = express.Router();
const Parameter = require('../../models/parameter.model.js');

// Lấy tất cả tham số
router.get('/', async (req, res) => {
  try {
    const params = await Parameter.find();
    res.json({ success: true, data: params });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy tham số theo key
router.get('/:key', async (req, res) => {
  try {
    const param = await Parameter.findOne({ key: req.params.key });
    if (!param) {
      return res.status(404).json({ success: false, message: 'Parameter not found' });
    }
    res.json({ success: true, data: param });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Tạo mới tham số
router.post('/', async (req, res) => {
  try {
    const { key, value, type, description, group, isEditable } = req.body;

    const existing = await Parameter.findOne({ key });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Parameter key already exists' });
    }

    const param = new Parameter({
      key,
      value,
      type,
      description,
      group,
      isEditable,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const saved = await param.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Cập nhật tham số theo key
router.put('/:key', async (req, res) => {
  try {
    const param = await Parameter.findOne({ key: req.params.key });
    if (!param) {
      return res.status(404).json({ success: false, message: 'Parameter not found' });
    }

    if (!param.isEditable) {
      return res.status(403).json({ success: false, message: 'Parameter is not editable' });
    }

    if (req.body.value !== undefined) param.value = req.body.value;
    if (req.body.description !== undefined) param.description = req.body.description;
    if (req.body.group !== undefined) param.group = req.body.group;
    if (req.body.type !== undefined) param.type = req.body.type;
    if (req.body.isEditable !== undefined) param.isEditable = req.body.isEditable;

    param.updated_at = new Date();

    const updated = await param.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Xóa tham số theo key
router.delete('/:key', async (req, res) => {
  try {
    const result = await Parameter.findOneAndDelete({ key: req.params.key });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Parameter not found' });
    }
    res.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  parameterRoutes: router,
};
