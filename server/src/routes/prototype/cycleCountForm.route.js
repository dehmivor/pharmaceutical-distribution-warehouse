const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Location = require('../../models/Location.model');
const Area = require('../../models/Area.model');
const Package = require('../../models/Package.model');
const Medicine = require('../../models/Medicine.model');
const CycleCountForm = require('../../models/CycleCountForm.model');
const Batch = require('../../models/Batch.model');
const Employee = require('../../models/Employee.model');

// Hàm helper để decode mã vị trí base64
function decodeLocationCode(code) {
  try {
    const decoded = Buffer.from(code, 'base64').toString('utf-8');
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/cycle-count-form/medicines-locations
router.get('/medicines-locations', async (req, res) => {
  try {
    const forms = await CycleCountForm.find()
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'content.location',
        select: 'name code row bay level area',
        populate: {
          path: 'area',
          model: 'Area',
          select: 'name type',
        },
      })
      .populate('content.verifiedBy', 'name email')
      .populate('content.result.package')
      .populate({
        path: 'content.result.package',
        populate: {
          path: 'content',
          model: 'Medicine',
        },
      });

    res.status(200).json({
      success: true,
      data: forms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cycle count forms',
      error: error.message,
    });
  }
});

// POST /api/cycle-count-form/
router.post(
  '/',
  [
    check('team.manager').notEmpty().withMessage('Manager không được để trống'),
    check('approvedBy').notEmpty().withMessage('approvedBy không được để trống'),
    check('startTime').notEmpty().withMessage('thời gian bắt đầu kiểm kê không được để trống'),
    check('endTime').notEmpty().withMessage('thời gian kết thúc kiểm kê không được để trống'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { team, status, verified, approvedBy, startTime, endTime, content } = req.body;

      const newForm = new CycleCountForm({
        team,
        status,
        verified,
        approvedBy,
        startTime,
        endTime,
        content,
      });

      await newForm.save();

      res.status(201).json({ success: true, data: newForm });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// POST /api/cycle-count-form/:id/verify-location
router.post('/:id/verify-location', async (req, res) => {
  try {
    const { id } = req.params;
    const { locationCode, itemIndex } = req.body;

    // Lấy form với populate location
    const form = await CycleCountForm.findById(id).populate('content.location');
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    // Kiểm tra itemIndex hợp lệ
    if (itemIndex < 0 || itemIndex >= form.content.length) {
      return res.json({
        success: false,
        message: 'Item index không hợp lệ',
        error: 'INVALID_INDEX',
      });
    }

    // Decode mã vị trí người dùng nhập
    const decodedLocation = decodeLocationCode(locationCode);
    if (!decodedLocation) {
      return res.json({ success: false, message: 'Mã vị trí không hợp lệ', error: 'INVALID_CODE' });
    }

    // Lấy item hiện tại
    const currentItem = form.content[itemIndex];
    if (!currentItem) {
      return res.json({ success: false, message: 'Item không tồn tại', error: 'ITEM_NOT_FOUND' });
    }

    // Tạo location string từ object location
    let locationString = '';
    if (typeof currentItem.location === 'string') {
      locationString = currentItem.location;
    } else if (currentItem.location && currentItem.location.code) {
      locationString = currentItem.location.code;
    } else if (
      currentItem.location &&
      currentItem.location.row &&
      currentItem.location.bay &&
      currentItem.location.level
    ) {
      // Tạo chuỗi từ row-bay-level
      locationString = `${currentItem.location.row}-${currentItem.location.bay}-${currentItem.location.level}`;
    } else if (currentItem.location && currentItem.location.toString) {
      locationString = currentItem.location.toString();
    }

    console.log('📍 Current location object:', currentItem.location);
    console.log('📍 Generated location string:', locationString);
    console.log('🔍 Decoded user input:', decodedLocation);
    console.log('🔄 Comparing:', decodedLocation, '===', locationString);

    // So sánh vị trí
    if (decodedLocation !== locationString) {
      return res.json({
        success: false,
        message: `Vị trí không khớp! Cần: ${locationString}, Nhập: ${decodedLocation}`,
        error: 'LOCATION_MISMATCH',
      });
    }

    // Cập nhật kết quả nếu đúng
    if (currentItem.result && Array.isArray(currentItem.result)) {
      currentItem.result = currentItem.result.map((pkg) => ({
        ...pkg,
        Status: true,
      }));
    }

    currentItem.verified = true;
    currentItem.verifiedBy = req.user ? req.user._id : null;

    await form.save({ validateBeforeSave: false });
    res.json({
      success: true,
      message: 'Vị trí được xác nhận và cập nhật thành công',
      decodedLocation: decodedLocation,
      expectedLocation: locationString,
      data: {
        itemIndex: itemIndex,
        verified: currentItem.verified,
        resultCount: currentItem.result ? currentItem.result.length : 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in verify-location:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/cycle-count-form/:id/result - Cập nhật toàn bộ content
router.patch('/:id/result', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate content structure
    if (!Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: 'Content must be an array',
      });
    }

    // Cập nhật form trong database
    const form = await CycleCountForm.findByIdAndUpdate(
      id,
      {
        content: content,
        lastModified: new Date(),
      },
      { new: true },
    );

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function để tạo mã base64 (cho testing)
function encodeLocationCode(locationString) {
  return Buffer.from(locationString, 'utf-8').toString('base64');
}

module.exports = {
  CycleCountFormRoutes: router,
  decodeLocationCode,
  encodeLocationCode,
};
