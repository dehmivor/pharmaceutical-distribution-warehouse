const ExportOrder = require('../models/ExportOrder');
const batchService = require('../services/batchService');
const User = require('../models/User');
const Package = require('../models/Package'); // Assuming you have a Package model defined
const packageService = require('../services/packageService');
const LogLocationChange = require('../models/LogLocationChange');
const { EXPORT_ORDER_STATUSES, USER_ROLES } = require('../utils/constants');
const exportOrderService = require('../services/exportOrderService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const Location = require('../models/Location');

// Helper function for population to ensure consistent data structure
const populateOptions = [
  { path: 'contract_id', select: 'contract_code' },
  { path: 'created_by', select: 'email' },
  { path: 'warehouse_manager_id', select: 'email' }, // Populating assigned staff's email
  { path: 'details.medicine_id', select: 'medicine_name unit_of_measure' }, // Populating medicine details
  { path: 'details.actual_item.package_id', select: 'package_code' }, // Populate package_code from Package model
  { path: 'details.actual_item.created_by', select: 'email' }, // Populate email from User model for who packed it
];

const getAllExportOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, warehouse_manager_id, created_by } = req.query;
    const result = await exportOrderService.getExportOrders(
      { status, warehouse_manager_id, created_by },
      parseInt(page),
      parseInt(limit),
    );
    res.status(200).json({ success: true, data: result.orders, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getExportOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, createdAt, warehouse_manager_id, created_by } = req.query;

    const params = {
      status: status || undefined,
      createdAt: createdAt || undefined,
      warehouse_manager_id: warehouse_manager_id || undefined,
      created_by: created_by || undefined,
    };

    const result = await exportOrderService.getExportOrdersFilter(
      params,
      parseInt(page, 10),
      parseInt(limit, 10),
    );

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error('Error fetching export orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const assignStaffToExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;
    // Validate staffId is a valid User with WAREHOUSE role
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== USER_ROLES.WAREHOUSEMANAGER) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid staff ID or staff is not a warehouse employee.' });
    }
    const order = await ExportOrder.findByIdAndUpdate(
      id,
      { warehouse_manager_id: staffId }, // Assigning staff to warehouse_manager_id
      { new: true, runValidators: true },
    ).populate(populateOptions);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Export Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updatePackingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { details } = req.body; // Array of { medicine_id, expected_quantity, actual_item, unit_price }

    // Basic validation for details array structure
    if (
      !Array.isArray(details) ||
      details.some((d) => !d.medicine_id || !Array.isArray(d.actual_item))
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid packing details format. 'details' must be an array of objects with 'medicine_id' and 'actual_item' array.",
      });
    }

    // Validate each actual_item entry within each detail
    for (const detail of details) {
      for (const item of detail.actual_item) {
        // Ensure package_id and created_by are present and quantity is a positive number
        if (
          !item.package_id ||
          typeof item.quantity !== 'number' ||
          item.quantity < 0 ||
          !item.created_by
        ) {
          return res.status(400).json({
            success: false,
            error:
              "Invalid actual_item format. Each item must have 'package_id', 'quantity' (non-negative number), and 'created_by'.",
          });
        }
        // Optional: You might want to add more robust validation here,
        // e.g., checking if package_id and created_by exist in your database.
        // const existingPackage = await Package.findById(item.package_id);
        // if (!existingPackage) return res.status(400).json({ success: false, error: `Package with ID ${item.package_id} not found.` });
        // const existingUser = await User.findById(item.created_by);
        // if (!existingUser) return res.status(400).json({ success: false, error: `User with ID ${item.created_by} not found.` });
      }
    }

    const order = await ExportOrder.findByIdAndUpdate(
      id,
      { details: details }, // Update the entire details array
      { new: true, runValidators: true },
    ).populate(populateOptions);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Export Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const completeExportOrder = async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Giả sử user được gắn vào req bởi middleware xác thực
  try {
    // Tìm đơn xuất kho
    const exportOrder = await ExportOrder.findById(id).populate(populateOptions);
    if (!exportOrder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn xuất kho' });
    }
    // Kiểm tra trạng thái đơn
    if (exportOrder.status !== EXPORT_ORDER_STATUSES.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Đơn xuất kho phải ở trạng thái đã phê duyệt để hoàn thành',
      });
    }
    // Kiểm tra quyền người dùng
    const isInternal = !exportOrder.contract_id; // Đơn nội bộ không có contract_id
    const isWarehouseManager = user.role === 'warehouse_manager';
    const isSupervisorAllowed = user.role === 'supervisor' && isInternal;
    if (!isWarehouseManager && !isSupervisorAllowed) {
      return res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền hoàn thành đơn xuất kho này' });
    }
    // Bắt đầu transaction để đảm bảo tính nguyên tử
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Lặp qua từng chi tiết trong đơn xuất kho
      for (const detail of exportOrder.details) {
        for (const item of detail.actual_item) {
          const packageId = item.package_id._id;
          const quantityToRemove = item.quantity;
          const warehouseUserId = item.created_by._id || item.created_by; // Lấy từ created_by trong exportInspectionSchema

          // Tìm package
          const pkg = await Package.findById(packageId).session(session);
          if (!pkg) {
            throw new Error(`Không tìm thấy package ${packageId}`);
          }

          // Kiểm tra số lượng đủ để giảm
          if (pkg.quantity < quantityToRemove) {
            throw new Error(
              `Số lượng trong package ${packageId} không đủ cho thuốc ${detail.medicine_id}`,
            );
          }

          // Giảm số lượng trong package
          pkg.quantity -= quantityToRemove;

          // Nếu số lượng về 0, xóa package
          if (pkg.quantity === 0) {
            await Package.findByIdAndDelete(packageId).session(session);
            console.log(`Deleted package ${packageId} - quantity reached 0`);
          } else {
            await pkg.save({ session });
          }

          // Ghi log thay đổi vị trí với ware_house_id từ created_by
          await LogLocationChange.create(
            [
              {
                location_id: pkg.location_id,
                type: 'remove',
                batch_id: pkg.batch_id,
                quantity: quantityToRemove,
                export_order_id: exportOrder._id,
                ware_house_id: warehouseUserId, // Sử dụng created_by từ exportInspectionSchema
              },
            ],
            { session },
          );
        }
      }
      // Cập nhật trạng thái đơn xuất kho
      exportOrder.status = EXPORT_ORDER_STATUSES.COMPLETED;
      await exportOrder.save({ session });
      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      const io = req.app.locals.io;

      try {
        const newNotification = await notificationService.createNotificationForAllSupervisors(
          {
            title: 'Đơn hàng xuất kho hoàn thành',
            message: `Đơn hàng xuất kho #${id.slice(-6)} đã được hoàn thành thành công.`,
            type: 'export',
            priority: 'medium',
            sender_id: user._id,
            action_url: `/sp-manage-bills`,
            metadata: {
              orderId: id,
              statusChangedTo: 'completed',
              orderType: 'export',
              action: 'order_completed',
              warehouseManagerId: user._id,
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

        console.log(`Đã tạo notification cho supervisor về đơn hàng xuất kho #${id} hoàn thành`);
      } catch (notificationError) {
        console.error('Lỗi khi tạo notification:', notificationError);
        // Không throw error vì notification không ảnh hưởng đến việc hoàn thành đơn hàng
      }

      return res.json({
        success: true,
        message: 'Đơn xuất kho đã hoàn thành thành công',
        data: exportOrder,
      });
    } catch (error) {
      // Hủy transaction nếu có lỗi
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi hoàn thành đơn xuất kho:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Lỗi server khi hoàn thành đơn xuất kho' });
  }
};

const cancelExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await ExportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Export Order not found' });
    }

    const isInternal = !order.contract_id;
    const isSupervisorAllowed = req.user.role === 'supervisor' && isInternal;
    const isWarehouseManager = req.user.role === 'warehouse_manager';
    if (!isSupervisorAllowed && !isWarehouseManager) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền hủy đơn này' });
    }

    order.status = EXPORT_ORDER_STATUSES.CANCELLED;
    await order.save();
    const populatedOrder = await ExportOrder.findById(id).populate(populateOptions);
    res.status(200).json({ success: true, data: populatedOrder });
  } catch (error) {
    next(error);
  }
};

const getExportOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const exportOrder = await exportOrderService.getExportOrderDetail(id);

    if (!exportOrder) {
      return res.status(404).json({
        success: false,
        message: `Export order with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: exportOrder,
    });
  } catch (error) {
    console.error('Error fetching export order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving export order',
      error: error.message,
    });
  }
};

const createExportOrder = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    const io = req.app.locals.io;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const newOrder = await exportOrderService.createExportOrder(req.body, userId);

    const newNotification = await notificationService.createNotificationForAllRepresentativeManager(
      {
        title: 'Đơn nhập mới đang chờ bạn duyệt',
        message: `Đơn nhập #${newOrder._id} vừa được tạo và đang chờ duyệt.`,
        type: 'export',
        priority: 'high',
        action_url: '/rm-export-orders-approval',
        metadata: {
          order_id: newOrder._id,
          order_status: newOrder.status,
          order_type: 'import',
        },
        sender_id: userId,
      },
      io,
    );

    if (newNotification && io) {
      console.log('Emitting newNotification to system room');
      io.to('system').emit('newNotification', newNotification);
    } else {
      console.log('Cannot emit: io =', io);
    }
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Create internal export order (WM) – contract_id null, status approved
const createInternalExportOrder = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    // Optional guard: only WM
    if (req.user.role !== USER_ROLES.WAREHOUSEMANAGER) {
      return res.status(403).json({
        success: false,
        error: 'Only warehouse manager can create internal export orders',
      });
    }

    const order = await exportOrderService.createInternalExportOrder(req.body, userId);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteExportOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const result = await exportOrderService.deleteExportOrder(id, user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateExportOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updatedOrder = await exportOrderService.updateExportOrder(id, req.body, user);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

const getPackagesNeededForExport = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid orderId URL parameter is required',
      });
    }

    // 1) Load full order
    const order = await exportOrderService.getExportOrderDetail(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Export order ${orderId} not found`,
      });
    }

    // 2) For each line, compute how many are still needed
    const needs = await Promise.all(
      order.details.map(async (detail) => {
        const { _id: detailId, medicine_id, expected_quantity, actual_item } = detail;
        const pickedTotal = actual_item.reduce((sum, i) => sum + i.quantity, 0);
        const neededQty = expected_quantity - pickedTotal;
        if (neededQty <= 0) return null;

        // 3) Fetch all valid batches
        const batches = await batchService.getValidBatches(medicine_id._id);

        // 4) Map of picked per package
        const pickedByPackage = actual_item.reduce((map, i) => {
          const pid = i.package_id._id.toString();
          map[pid] = (map[pid] || 0) + i.quantity;
          return map;
        }, {});

        let remaining = neededQty;
        const selectedPackages = [];

        for (const batch of batches) {
          if (remaining <= 0) break;

          const pkgs = await packageService.getPackagesByBatch(batch._id);

          // sort by least available first
          pkgs.sort((a, b) => {
            const availA = a.quantity - (pickedByPackage[a._id.toString()] || 0);
            const availB = b.quantity - (pickedByPackage[b._id.toString()] || 0);
            return availA - availB;
          });

          for (const pkgDoc of pkgs) {
            if (remaining <= 0) break;
            if (!pkgDoc.location_id) continue;

            const pid = pkgDoc._id.toString();
            const alreadyPicked = pickedByPackage[pid] || 0;
            const avail = pkgDoc.quantity - alreadyPicked;
            if (avail <= 0) continue;

            const take = Math.min(avail, remaining);
            remaining -= take;

            selectedPackages.push({
              package_id: pkgDoc._id,
              batch_id: {
                _id: batch._id,
                batch_code: batch.batch_code,
                expiry_date: batch.expiry_date,
              },
              take_quantity: take,
              location: {
                bay: pkgDoc.location_id.bay,
                row: pkgDoc.location_id.row,
                column: pkgDoc.location_id.column,
                area_name: pkgDoc.location_id.area_id?.name || null,
              },
            });
          }
        }

        return {
          detail_id: detailId,
          medicine_id,
          needed_quantity: neededQty,
          packages: selectedPackages,
        };
      }),
    );

    const outstanding = needs.filter((x) => x && x.packages.length > 0);

    return res.json({
      success: true,
      data: { outstanding },
    });
  } catch (err) {
    console.error('❌ Error in getPackagesNeededForExport:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error computing packages needed for export',
    });
  }
};

const addExportInspection = async (req, res) => {
  try {
    const { orderId, detailId } = req.params;
    const { package_id, quantity, user_id } = req.body;

    // 1) Validate request body
    if (!package_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'package_id and quantity are required',
      });
    }
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive integer',
      });
    }
    if (!user_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'user_id are required',
      });
    }

    const created_by = user_id;

    // 3) Delegate to service
    const newInspection = await exportOrderService.addExportInspection(orderId, detailId, {
      package_id,
      quantity,
      created_by,
    });

    // 4) Respond
    return res.status(201).json({
      success: true,
      data: newInspection,
    });
  } catch (err) {
    console.error('Error adding export inspection:', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Server error adding export inspection',
    });
  }
};

// Approve export order - chỉ cho phép representative_manager
const approveExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const io = req.app.locals.io;

    // Kiểm tra quyền - chỉ representative_manager mới được approve
    if (req.user.role !== 'representative_manager') {
      return res.status(403).json({
        success: false,
        error: 'Only representative managers can approve export orders',
      });
    }

    const approvedOrder = await exportOrderService.approveExportOrder(id, userId);

    // Notify representative (creator) about approval
    try {
      if (approvedOrder && approvedOrder.created_by) {
        const newNotification = await notificationService.createNotification(
          {
            recipient_id: approvedOrder.created_by,
            title: 'Đơn xuất kho được phê duyệt',
            message: `Đơn xuất kho #${id.slice(-6)} đã được phê duyệt.`,
            type: 'export',
            priority: 'medium',
            action_url: `/rp-export-orders`,
            metadata: {
              order_id: id,
              order_status: 'approved',
              order_type: 'export',
              status_change_date: new Date(),
              changed_by: userId,
            },
          },
          io,
        );

        if (newNotification && io) {
          io.to('system').emit('newNotification', newNotification);
        }
      }
    } catch (notifyErr) {
      console.error('Lỗi khi tạo notification cho RP (approve export):', notifyErr);
    }

    res.status(200).json({
      success: true,
      data: approvedOrder,
      message: 'Export order approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reject export order - chỉ cho phép representative_manager
const rejectExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const io = req.app.locals.io;

    // Kiểm tra quyền - chỉ representative_manager mới được reject
    if (req.user.role !== 'representative_manager') {
      return res.status(403).json({
        success: false,
        error: 'Only representative managers can reject export orders',
      });
    }

    const rejectedOrder = await exportOrderService.rejectExportOrder(id, userId);

    // Notify representative (creator) about rejection
    try {
      if (rejectedOrder && rejectedOrder.created_by) {
        const newNotification = await notificationService.createNotification(
          {
            recipient_id: rejectedOrder.created_by,
            title: 'Đơn xuất kho bị từ chối',
            message: `Đơn xuất kho #${id.slice(-6)} đã bị từ chối.`,
            type: 'export',
            priority: 'medium',
            action_url: `/rp-export-orders`,
            metadata: {
              order_id: id,
              order_status: 'rejected',
              order_type: 'export',
              status_change_date: new Date(),
              changed_by: userId,
            },
          },
          io,
        );

        if (newNotification && io) {
          io.to('system').emit('newNotification', newNotification);
        }
      }
    } catch (notifyErr) {
      console.error('Lỗi khi tạo notification cho RP (reject export):', notifyErr);
    }

    res.status(200).json({
      success: true,
      data: rejectedOrder,
      message: 'Export order rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra tồn kho cho export order
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkStockForExportOrder = async (req, res) => {
  try {
    const { details } = req.body;

    // Validate input
    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Details array is required and must not be empty',
      });
    }

    // Validate each detail
    for (const detail of details) {
      if (!detail.medicine_id || !detail.expected_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each detail must have medicine_id and expected_quantity',
        });
      }
    }

    // Check stock availability
    const result = await exportOrderService.checkStockAvailability(details);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking stock for export order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const assignWarehouseManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouse_manager_id } = req.body;

    // Kiểm tra quyền - chỉ representative_manager mới được assign
    if (req.user.role !== 'warehouse_manager') {
      return res.status(403).json({
        success: false,
        error: 'Only representative managers can assign warehouse managers',
      });
    }

    // Validate warehouse_manager_id
    if (!warehouse_manager_id) {
      return res.status(400).json({
        success: false,
        error: 'warehouse_manager_id is required',
      });
    }

    const assignedOrder = await exportOrderService.assignWarehouseManager(id, warehouse_manager_id);

    res.status(200).json({
      success: true,
      data: assignedOrder,
      message: 'Warehouse manager assigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const exportedTotalsLast6MonthsTop5 = async (req, res) => {
  try {
    const result = await exportOrderService.getExportedTotalsLast6Months();
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('exportedTotalsLast6Months error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const docx = async (req, res) => {
  const { id } = req.params;
  try {
    const buffer = await exportOrderService.createTranscriptionDocBuffer(id);

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
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
  getExportOrderDetail,
  createExportOrder,
  deleteExportOrder,
  updateExportOrder,
  getExportOrders,
  getPackagesNeededForExport,
  addExportInspection,
  approveExportOrder,
  rejectExportOrder, // Thêm function mới
  checkStockForExportOrder,
  assignWarehouseManager,
  createInternalExportOrder,
  exportedTotalsLast6MonthsTop5,
  docx,
};
