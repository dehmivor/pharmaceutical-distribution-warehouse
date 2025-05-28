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

// GET /api/cycle-count-form/medicines-locations
router.get('/medicines-locations', async (req, res) => {
  try {
    const forms = await CycleCountForm.find()
      .populate('team.manager', 'name email') // Populate manager với các trường cần thiết
      .populate('team.members', 'name email') // Populate thành viên
      .populate('approvedBy', 'name email') // Populate người duyệt
      .populate({
        path: 'content.location',
        select: 'name code row bay level area',
        populate: {
          path: 'area',
          model: 'Area', // Nếu location có trường area là ObjectId
          select: 'name type', // Các trường bạn muốn lấy của Area
        },
      })
      .populate('content.verifiedBy', 'name email') // Populate người xác nhận location
      .populate('content.result.package') // Populate package
      .populate({
        path: 'content.result.package',
        populate: {
          path: 'content',
          model: 'Medicine', // Populate nội dung của package (thuốc)
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
    // Có thể bổ sung validate cho content nếu muốn
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { team, status, verified, approvedBy, startTime, endTime, content } = req.body;

      // Tạo mới cycle count form
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
// PATCH /api/cycle-count-form/:id/result
router.patch('/:id/result', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body; // content: [{location, verified, verifiedBy, result: [{Package, Status}]}]

    const form = await CycleCountForm.findByIdAndUpdate(id, { content }, { new: true });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/cycle-count-forms/:id', async (req, res) => {
  try {
    const form = await CycleCountForm.findById(req.params.id)
      .populate('team.manager', 'name email')
      .populate('team.members', 'name email')
      .populate('approvedBy', 'name email')
      .populate('content.location', 'name code')
      .populate('content.verifiedBy', 'name email')
      .populate('content.result.package')
      .populate({
        path: 'content.result.package',
        populate: {
          path: 'content',
          model: 'Medicine',
        },
      });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cycle count form',
      });
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết cycle count form',
      error: error.message,
    });
  }
});

module.exports = {
  CycleCountFormRoutes: router,
};
