const inventoryCheckOrderService = require('../services/inventoryCheckOrderService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { INVENTORY_CHECK_ORDER_STATUSES, USER_ROLES } = require('../utils/constants');

// Get all inventory check orders with pagination and filters
const getAllInventoryCheckOrders = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    warehouse_manager_id,
    sortBy,
    sortDirection,
    search,
    searchBy,
  } = req.query;

  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    startDate,
    endDate,
    warehouse_manager_id,
    sortBy,
    sortDirection,
    search,
    searchBy,
  };

  const result = await inventoryCheckOrderService.getAllInventoryCheckOrders(filters);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message,
    });
  }

  // Add filter options to response
  const filterOptions = {
    status: Object.values(INVENTORY_CHECK_ORDER_STATUSES),
  };

  res.status(200).json({
    success: true,
    data: result.data,
    filterOptions,
  });
});

// Create new inventory check order (only supervisor can create)
const createInventoryCheckOrder = asyncHandler(async (req, res) => {
  // Check if user is supervisor
  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ supervisor mới có quyền tạo phiếu kiểm kê',
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const inventoryCheckOrderData = {
    ...req.body,
    created_by: req.user.userId, // Add created_by field
  };

  const result =
    await inventoryCheckOrderService.createInventoryCheckOrder(inventoryCheckOrderData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
      errors: result.errors,
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message,
  });
});

// Get inventory check order by ID
const getInventoryCheckOrderById = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  const result = await inventoryCheckOrderService.getInventoryCheckOrderById(id);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      message: result.message,
    });
  }

  res.status(200).json({
    success: true,
    data: result.data,
  });
});

// Update inventory check order
const updateInventoryCheckOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if user is supervisor (only supervisor can update inventory check orders)
  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ supervisor mới có quyền cập nhật phiếu kiểm kê',
    });
  }

  const result = await inventoryCheckOrderService.updateInventoryCheckOrder(id, updateData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
      errors: result.errors,
    });
  }

  res.status(200).json({
    success: true,
    data: result.data,
    message: result.message,
  });
});

// Create inspections for inventory check order
const createInspections = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is warehouse manager
  if (req.user.role !== USER_ROLES.WAREHOUSEMANAGER) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ warehouse manager mới có quyền tạo phiếu kiểm kê con',
    });
  }

  const result = await inventoryCheckOrderService.createInspections(id);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message,
  });
});

module.exports = {
  getAllInventoryCheckOrders,
  createInventoryCheckOrder,
  getInventoryCheckOrderById,
  updateInventoryCheckOrder,
  createInspections,
};
