const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const areaService = require('../services/areaService');
const { USER_ROLES } = require('../utils/constants');

const getAllAreas = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { page = 1, limit = 10, search = '' } = req.query;
  
  const result = await areaService.getAllAreas(
    parseInt(page),
    parseInt(limit),
    search
  );

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, data: result.data });
});

const createArea = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({ 
      success: false, 
      message: 'Chỉ supervisor mới có quyền tạo khu vực' 
    });
  }

  const result = await areaService.createArea(req.body);
  
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.status(201).json({ success: true, data: result.data, message: result.message });
});

const getAreaById = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const result = await areaService.getAreaById(id);
  
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, data: result.data });
});

const updateArea = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({ 
      success: false, 
      message: 'Chỉ supervisor mới có quyền cập nhật khu vực' 
    });
  }

  const { id } = req.params;
  const updateData = req.body;
  
  const result = await areaService.updateArea(id, updateData);
  
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, data: result.data, message: result.message });
});

const deleteArea = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({ 
      success: false, 
      message: 'Chỉ supervisor mới có quyền xóa khu vực' 
    });
  }

  const { id } = req.params;
  const result = await areaService.deleteArea(id);
  
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, message: result.message });
});

module.exports = {
  getAllAreas,
  createArea,
  getAreaById,
  updateArea,
  deleteArea,
};
