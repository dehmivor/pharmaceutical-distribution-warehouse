const importOrderService = require('../services/importOrderService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const { io } = require('../server');

// Create new import order
const createImportOrder = async (req, res) => {
  try {
    const { orderData, orderDetails } = req.body;
    const io = req.app.locals.io;

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

    const newNotification = await notificationService.createNotificationForAllRepresentativeManager(
      {
        title: 'Đơn nhập mới đang chờ bạn duyệt',
        message: `Đơn nhập #${newOrder._id} vừa được tạo và đang chờ duyệt.`,
        type: 'import',
        priority: 'high',
        action_url: '/rm-import-orders-approval',
        metadata: {
          order_id: newOrder._id,
          order_status: newOrder.status,
          order_type: 'import',
        },
        sender_id: userContext?.id,
      },
      io,
    );

    if (newNotification && io) {
      console.log('Emitting newNotification to system room');
      io.to('system').emit('newNotification', newNotification);
    } else {
      console.log('Cannot emit: io =', io);
    }

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
    const io = req.app.locals.io;
    const { status } = req.body;
    const userId = req.user && req.user._id;
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

    const currentOrder = await importOrderService.getImportOrderById(id);
    if (!currentOrder) {
      return res.status(404).json({ success: false, error: 'Import order not found' });
    }
    if (currentOrder.created_by) {
      try {
        let notificationTitle, notificationMessage, priority;

        switch (status) {
          case 'approved':
            notificationTitle = 'Đơn hàng nhập kho được duyệt';
            notificationMessage = `Đơn hàng nhập kho #${id.slice(20)} của bạn đã được duyệt.`;
            priority = 'medium';
            break;
          case 'rejected':
            notificationTitle = 'Đơn hàng nhập kho bị từ chối';
            notificationMessage = `Đơn hàng nhập kho #${id.slice(20)} của bạn đã bị từ chối.`;
            priority = 'high';
            break;
          case 'arranged':
            notificationTitle = 'Đơn hàng đã được sắp xếp';
            notificationMessage = `Đơn hàng nhập kho #${id.slice(20)} đã được sắp xếp và sẵn sàng để cất hàng.`;
            priority = 'high';
            break;
          case 'delivered':
            notificationTitle = 'Đơn hàng đã đến';
            notificationMessage = `Đơn hàng nhập kho #${id.slice(20)} đã đến nơi.`;
            priority = 'medium';
            break;
          case 'completed':
            notificationTitle = 'Đơn hàng nhập kho hoàn thành';
            notificationMessage = `Đơn hàng nhập kho #${id.slice(20)} của bạn đã hoàn thành.`;
            priority = 'low';
            break;
          default:
            // Không tạo notification cho các status khác
            break;
        }

        // Tạo notification nếu có title và message
        if (notificationTitle && notificationMessage) {
          const newNotification = await notificationService.createNotification(
            {
              recipient_id: updatedOrder.created_by, // ID của representative đã tạo đơn hàng
              title: notificationTitle,
              message: notificationMessage,
              type: 'import',
              priority: priority,
              action_url: `/rp-import-orders`,
              metadata: {
                order_id: id,
                order_status: status,
                order_type: 'import',
                previous_status: updatedOrder.status,
                contract_code: updatedOrder.contract_id?.contract_code || 'N/A',
                supplier_name: updatedOrder.contract_id?.partner_id?.name || 'N/A',
                status_change_date: new Date(),
                changed_by: userId,
              },
            },
            io,
          );

          if (newNotification && io) {
            console.log('Emitting newNotification to system room');
            io.to('system').emit('newNotification', newNotification);
          } else {
            console.log('Cannot emit: io =', io);
          }

          console.log(
            `✅ Đã tạo notification cho representative ${updatedOrder.created_by} về việc thay đổi status đơn hàng #${id} sang ${status}`,
          );
        }

        if (status === 'delivered') {
          try {
            const newNotification = await notificationService.createNotificationForAllWarehouse(
              {
                title: 'Hãy bắt đầu kiểm nhập',
                message: `Đơn nhập kho #${id.slice(20)} đã đến nơi.`,
                type: 'import',
                priority: 'high',
                action_url: `/wh-create-inspections/with-import-ord/${id}`,
                metadata: {
                  order_id: id,
                  order_status: status,
                  order_type: 'import',
                  status_change_date: new Date(),
                  changed_by: userId,
                  contract_code: updatedOrder.contract_id?.contract_code || 'N/A',
                  supplier_name: updatedOrder.contract_id?.partner_id?.name || 'N/A',
                },
              },
              io,
            );

            if (newNotification && io) {
              console.log('Emitting newNotification to system room');
              io.to('system').emit('newNotification', newNotification);
            } else {
              console.log('Cannot emit: io =', io);
            }
          } catch (warehouseNotificationError) {
            // Log lỗi notification nhưng không ảnh hưởng đến việc update status
            console.error(
              'Lỗi khi tạo notification cho warehouse users:',
              warehouseNotificationError,
            );
          }
        }
        // Tạo notification cho warehouse users khi status chuyển sang 'arranged'
        if (status === 'arranged') {
          try {
            const newNotification = await notificationService.createNotificationForAllWarehouse(
              {
                title: 'Đơn hàng sẵn sàng để cất hàng',
                message: `Đơn nhập kho #${id.slice(20)} đã được tạo lô.`,
                type: 'import',
                priority: 'high',
                action_url: `/wh-import-orders/${id}`,
                metadata: {
                  order_id: id,
                  order_status: status,
                  order_type: 'import',
                  status_change_date: new Date(),
                  changed_by: userId,
                  contract_code: updatedOrder.contract_id?.contract_code || 'N/A',
                  supplier_name: updatedOrder.contract_id?.partner_id?.name || 'N/A',
                },
              },
              io,
            );

            if (newNotification && io) {
              console.log('Emitting newNotification to system room');
              io.to('system').emit('newNotification', newNotification);
            } else {
              console.log('Cannot emit: io =', io);
            }

            console.log(
              `✅ Đã tạo notification cho warehouse users về việc đơn hàng #${id} sẵn sàng để cất hàng`,
            );
          } catch (warehouseNotificationError) {
            // Log lỗi notification nhưng không ảnh hưởng đến việc update status
            console.error(
              'Lỗi khi tạo notification cho warehouse users:',
              warehouseNotificationError,
            );
          }
        }
      } catch (notificationError) {
        // Log lỗi notification nhưng không ảnh hưởng đến việc update status
        console.error('Lỗi khi tạo notification cho representative:', notificationError);
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

const docx = async (req, res) => {
  const { id } = req.params;
  try {
    const buffer = await importOrderService.createTranscriptionDocBuffer(id);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="phieu_nhap_kho_transcription.docx"',
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error in downloadTranscriptionDocx:', err);
    res.status(500).send('Internal server error');
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
  docx,
};
