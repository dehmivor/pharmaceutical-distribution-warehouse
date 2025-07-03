const importOrderService = require('../services/importOrderService');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');

// Create new import order
const createImportOrder = async (req, res) => {
  try {
    const { orderData, orderDetails } = req.body;

    // Add created_by from authenticated user if available
    if (req.user && req.user._id) {
      orderData.created_by = req.user._id;
    } else {
      // For testing purposes, use a default supervisor ID
      orderData.created_by = '22ec4da883aa4736aa000001'; // Default supervisor ID
    }

    const newOrder = await importOrderService.createImportOrder(orderData, orderDetails);

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all import orders with filters
const getImportOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id ? req.user.id.toString() : null;

    let query = {};
    
    // Warehouse manager chỉ xem orders được gán cho mình
    if (userRole === 'warehouse_manager') {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.warehouse_manager_id = userId;
        query.status = 'delivered'; // Chỉ lấy order đã giao
        console.log('DEBUG getImportOrders:', { userRole, userId, query });
      }
    }

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'supplier_contract_id.contract_code': { $regex: search, $options: 'i' } }
      ];
    }

    const result = await importOrderService.getImportOrders(query, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get import order by ID
const getImportOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await importOrderService.getImportOrderById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

// Update import order
const updateImportOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderData, orderDetails } = req.body;
    // Gộp lại thành object đúng schema
    const updateData = {
      ...orderData,
      details: orderDetails
    };
    const updatedOrder = await importOrderService.updateImportOrder(id, updateData);
    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update import order details
const updateImportOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { details } = req.body;

    const updatedDetails = await importOrderService.updateImportOrderDetails(id, details);

    res.status(200).json({
      success: true,
      data: updatedDetails,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Add import order detail
const addImportOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const detailItem = req.body;

    const updatedOrder = await importOrderService.addImportOrderDetail(id, detailItem);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update specific import order detail
const updateImportOrderDetail = async (req, res) => {
  try {
    const { id, detailId } = req.params;
    const updateData = req.body;

    const updatedOrder = await importOrderService.updateImportOrderDetail(id, detailId, updateData);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Remove import order detail
const removeImportOrderDetail = async (req, res) => {
  try {
    const { id, detailId } = req.params;

    const updatedOrder = await importOrderService.removeImportOrderDetail(id, detailId);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete import order
const deleteImportOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await importOrderService.deleteImportOrder(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if user is supervisor and bypass validation
    const bypassValidation = req.user && req.user.role === 'supervisor';
    const approvalBy = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;


    // Kiểm tra quyền của warehouse manager (chỉ warehouse_manager mới được phép)
    if (userRole === 'warehouse_manager') {
      // Warehouse manager chỉ có thể thay đổi sang checked và arranged
      const allowedStatuses = ['checked', 'arranged', 'delivered', 'completed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(200).json({
          success: false,
          error: `Warehouse manager can only change status to: ${allowedStatuses.join(', ')}`
        });
      }

      // Kiểm tra xem order có được gán cho warehouse manager này không
      const order = await importOrderService.getImportOrderById(id);
      // So sánh quyền bằng email thay vì id
      const managerEmail = order.warehouse_manager_id && order.warehouse_manager_id.email
        ? order.warehouse_manager_id.email
        : null;
      console.log('DEBUG so sánh quyền bằng email:', {
        orderId: id,
        warehouse_manager_email: managerEmail,
        reqUserEmail: req.user.email
      });
      if (!managerEmail || !req.user.email || managerEmail !== req.user.email) {
        return res.status(403).json({
          success: false,
          error: 'You can only update orders assigned to you'
        });
      }
    }

    const updatedOrder = await importOrderService.updateOrderStatus(id, status, approvalBy, bypassValidation);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get import orders by warehouse manager
const getImportOrdersByWarehouseManager = async (req, res) => {
  try {
    const { warehouseManagerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const result = await importOrderService.getImportOrdersByWarehouseManager(
      warehouseManagerId,
      query,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get import orders by supplier contract
const getImportOrdersBySupplierContract = async (req, res) => {
  try {
    const { supplierContractId } = req.params;

    const orders = await importOrderService.getImportOrdersBySupplierContract(supplierContractId);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get valid status transitions
const getValidStatusTransitions = async (req, res) => {
  try {
    const { currentStatus } = req.query;
    
    if (currentStatus) {
      // Get valid transitions for specific status
      const validTransitions = importOrderService.getValidStatusTransitions(currentStatus);
      res.status(200).json({
        success: true,
        data: {
          currentStatus,
          validTransitions,
        },
      });
    } else {
      // Get all status transitions mapping
      const allTransitions = importOrderService.getAllStatusTransitions();
      res.status(200).json({
        success: true,
        data: allTransitions,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Assign warehouse manager
const assignWarehouseManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_manager_id } = req.body;
    if (!warehouse_manager_id) {
      return res.status(400).json({ success: false, error: 'warehouse_manager_id is required' });
    }
    const updatedOrder = await importOrderService.assignWarehouseManager(id, warehouse_manager_id);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createImportOrder,
  getImportOrders,
  getImportOrderById,
  updateImportOrder,
  updateImportOrderDetails,
  addImportOrderDetail,
  updateImportOrderDetail,
  removeImportOrderDetail,
  deleteImportOrder,
  updateOrderStatus,
  getImportOrdersByWarehouseManager,
  getImportOrdersBySupplierContract,
  getValidStatusTransitions,
  assignWarehouseManager,
};
