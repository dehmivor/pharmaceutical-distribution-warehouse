const importOrderService = require('../services/importOrderService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// Create new import order
const createImportOrder = async (req, res) => {
  try {
    const { orderData, orderDetails } = req.body;

    // Add created_by from authenticated user if available
    if (req.user && req.user.userId) {
      orderData.created_by = req.user.userId;
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication required: cannot determine user creating order',
      });
    }

    // Truyền user context vào service
    const userContext = req.user ? { role: req.user.role, id: req.user._id } : null;
    const newOrder = await importOrderService.createImportOrder(
      orderData,
      orderDetails,
      userContext,
    );

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

// Create internal import order (for warehouse manager)
const createInternalImportOrder = async (req, res) => {
  try {
    const { orderDetails } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user is warehouse manager
    if (req.user.role !== 'warehouse_manager') {
      return res.status(403).json({
        success: false,
        error: 'Only warehouse managers can create internal import orders',
      });
    }

    // Truyền user context vào service
    const userContext = { role: req.user.role, id: req.user.userId, _id: req.user.userId };
    const newOrder = await importOrderService.createInternalImportOrder(orderDetails, userContext);

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
    const {
      page = 1,
      limit = 10,
      status,
      createdAt,
      contract_code,
      supplier,
      warehouse_manager_id,
    } = req.query;

    const params = {
      status,
      createdAt: createdAt || undefined,
      contract_code: contract_code || undefined,
      supplier: supplier || undefined,
      warehouse_manager_id: warehouse_manager_id || undefined,
    };

    const result = await importOrderService.getImportOrders(
      params,
      parseInt(page, 10),
      parseInt(limit, 10),
      req.user?.role, // Truyền user role để filter đơn nội bộ
    );

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
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
      details: orderDetails,
    };

    // Truyền user context vào service
    const userContext = req.user ? { role: req.user.role, id: req.user._id } : null;
    const updatedOrder = await importOrderService.updateImportOrder(id, updateData, userContext);

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
    const approvalBy = req.user ? req.user._id : null;
    const userRole = req.user ? req.user.role : null;

    // Chỉ cho phép RM chuyển sang approved hoặc rejected
    if (userRole === 'representative_manager') {
      const allowedStatuses = ['approved', 'rejected'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          error: `Representative Manager can only change status to: ${allowedStatuses.join(', ')}`,
        });
      }
    }

    // Representative chỉ được chuyển từ rejected về draft
    if (userRole === 'representative') {
      // Lấy order hiện tại để kiểm tra trạng thái
      const order = await importOrderService.getImportOrderById(id);
      if (!(order.status === 'rejected' && status === 'draft')) {
        return res.status(403).json({
          success: false,
          error: 'Representative can only change status from rejected to draft',
        });
      }
    }

    // Kiểm tra quyền của warehouse manager (chỉ warehouse_manager mới được phép)
    if (userRole === 'warehouse_manager') {
      // Warehouse manager chỉ có thể thay đổi sang checked và arranged
      const allowedStatuses = ['checked', 'arranged', 'delivered', 'completed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(200).json({
          success: false,
          error: `Warehouse manager can only change status to: ${allowedStatuses.join(', ')}`,
        });
      }

      // Kiểm tra xem order có được gán cho warehouse manager này không
      const order = await importOrderService.getImportOrderById(id);

      // For internal orders (no contract_id), allow the creator to update
      if (!order.contract_id) {
        // Internal order - check if current user is the creator
        if (order.created_by && order.created_by._id && req.user.userId) {
          if (order.created_by._id.toString() !== req.user.userId) {
            return res.status(403).json({
              success: false,
              error: 'You can only update internal orders created by you',
            });
          }
        }
      } else {
        // Regular order - so sánh quyền bằng email
        const managerEmail =
          order.warehouse_manager_id && order.warehouse_manager_id.email
            ? order.warehouse_manager_id.email
            : null;
        if (!managerEmail || !req.user.email || managerEmail !== req.user.email) {
          return res.status(403).json({
            success: false,
            error: 'You can only update orders assigned to you',
          });
        }
      }
    }

    const updatedOrder = await importOrderService.updateOrderStatus(
      id,
      status,
      approvalBy,
      bypassValidation,
    );

    if (status === 'delivered') {
      try {
        await notificationService.createNotificationForAllWarehouse({
          title: 'Đơn hàng đã đến',
          message: `Đơn hàng #${id.slice(20)} đã đến, hãy bắt đầu kiểm nhập`,
          type: 'import',
          priority: 'high',
          sender_id: req.user._id,
          action_url: `/wh-create-inspections/with-import-ord/${id}`,
          metadata: {
            orderId: id,
            statusChangedTo: 'delivered',
            orderType: 'import',
            warehouseId: updatedOrder.warehouse_id || null,
          },
        });

        console.log(
          `Đã tạo notification cho warehouse managers khi đơn hàng #${id} chuyển sang delivered`,
        );
      } catch (notificationError) {
        // Log lỗi notification nhưng không ảnh hưởng đến việc update status
        console.error('Lỗi khi tạo notification:', notificationError);
      }
    }

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
      parseInt(limit),
      req.user?.role, // Truyền user role để filter đơn nội bộ
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

// Get import orders by contract
const getImportOrdersByContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const orders = await importOrderService.getImportOrdersByContract(contractId, req.user?.role);

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

// Assign warehouse manager (chỉ có thể tự assign cho chính mình)
const assignWarehouseManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_manager_id } = req.body;
    const currentUserId = req.user.userId; // ID của warehouse manager hiện tại

    if (!warehouse_manager_id) {
      return res.status(400).json({ success: false, error: 'warehouse_manager_id is required' });
    }

    // Kiểm tra warehouse manager chỉ có thể assign cho chính mình
    if (warehouse_manager_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Warehouse manager can only assign orders to themselves',
      });
    }

    const updatedOrder = await importOrderService.assignWarehouseManager(id, warehouse_manager_id);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createImportOrder,
  createInternalImportOrder,
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
  getImportOrdersByContract,
  getValidStatusTransitions,
  assignWarehouseManager,
};
