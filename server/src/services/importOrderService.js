const ImportOrder = require('../models/ImportOrder');
const { IMPORT_ORDER_STATUSES, USER_ROLES } = require('../utils/constants');
const { User, SupplierContract, Supplier } = require('../models');
const getInspectionByImportOrderId = require("./inspectionService").getInspectionByImportOrderId;
const mongoose = require('mongoose');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
} = require("docx");

// Create new import order
const createImportOrder = async (orderData, orderDetails, userContext = null) => {
  try {
    const newOrderData = {
      ...orderData,
      details: orderDetails,
    };

    const newOrder = new ImportOrder(newOrderData);

    // Truyền user context vào model để validation
    if (userContext) {
      newOrder._userContext = userContext;
    }

    const savedOrder = await newOrder.save();

    return await ImportOrder.findById(savedOrder._id)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');
  } catch (error) {
    throw error;
  }
};

// Create internal import order (for warehouse manager)
const createInternalImportOrder = async (orderDetails, userContext = null) => {
  try {
    // Validate user context
    if (!userContext || userContext.role !== USER_ROLES.WAREHOUSEMANAGER) {
      throw new Error('Only warehouse managers can create internal import orders');
    }

    const orderData = {
      status: IMPORT_ORDER_STATUSES.DELIVERED, // Start with delivered status
      contract_id: null, // No contract for internal orders
      warehouse_manager_id: userContext.id || userContext._id, // Set to current warehouse manager
      approval_by: null, // No approval needed
      created_by: userContext.id || userContext._id // Set created_by to current user
    };

    return await createImportOrder(orderData, orderDetails, userContext);
  } catch (error) {
    throw error;
  }
};

// Get all import orders with pagination and filters
const getImportOrders = async (params = {}, page = 1, limit = 10, userRole = null) => {
  const skip = (page - 1) * limit;
  const query = {};

  // 1) Filter by status
  if (params.status) {
    query.status = params.status;
  }

  // 2) Filter by warehouse_manager_id
  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  // 3) Filter by createdAt day
  if (params.createdAt) {
    const start = new Date(params.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  // 4) Filter internal orders for Representative and Representative Manager
  if (userRole === 'representative' || userRole === 'representative_manager') {
    query.contract_id = { $ne: null }; // Chỉ hiển thị đơn có contract (không hiển thị đơn nội bộ)
  }

  // 4) Query the DB
  const [orders, total] = await Promise.all([
    ImportOrder.find(query)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'email name role')
      .populate('created_by', 'email name role')
      .populate('approval_by', 'email name role')
      .populate('details.medicine_id', 'medicine_name license_code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),

    ImportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
};

const getImportOrderById = async (orderId) => {
  try {
    const order = await ImportOrder.findById(orderId)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code unit_of_measure');

    if (!order) {
      throw new Error('Import order not found');
    }

    return order;
  } catch (error) {
    throw error;
  }
};
// Update import order
const updateImportOrder = async (orderId, updateData, userContext = null) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Lưu trạng thái gốc để validation
    order._original = { status: order.status };

    // Truyền user context vào model để validation
    if (userContext) {
      order._userContext = userContext;
      // Nếu là representative và order đang rejected, chuyển về draft
      if (
        userContext.role === 'representative' &&
        order.status === IMPORT_ORDER_STATUSES.REJECTED
      ) {
        order.status = IMPORT_ORDER_STATUSES.DRAFT;
      }
    }

    // Cập nhật từng field để trigger validation
    Object.keys(updateData).forEach((key) => {
      order[key] = updateData[key];
    });

    const updatedOrder = await order.save();

    return await ImportOrder.findById(updatedOrder._id)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');
  } catch (error) {
    throw error;
  }
};

// Update import order details
const updateImportOrderDetails = async (orderId, orderDetails) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $set: { details: orderDetails } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Add item to import order details
const addImportOrderDetail = async (orderId, detailItem) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Validate required fields for detail item
    if (!detailItem.medicine_id || !detailItem.quantity) {
      throw new Error('medicine_id and quantity are required for import order detail');
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $push: { details: detailItem } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Update specific import order detail
const updateImportOrderDetail = async (orderId, detailId, updateData) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Validate that the detail item exists
    const detailItem = order.details.id(detailId);
    if (!detailItem) {
      throw new Error('Import order detail not found');
    }

    // Prepare update data with proper field mapping
    const updateFields = {};
    Object.keys(updateData).forEach((key) => {
      updateFields[`details.$.${key}`] = updateData[key];
    });

    const updatedOrder = await ImportOrder.findOneAndUpdate(
      { _id: orderId, 'details._id': detailId },
      { $set: updateFields },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Remove item from import order details
const removeImportOrderDetail = async (orderId, detailId) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $pull: { details: { _id: detailId } } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Delete import order
const deleteImportOrder = async (orderId) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be deleted
    if (
      order.status !== IMPORT_ORDER_STATUSES.DRAFT &&
      order.status !== IMPORT_ORDER_STATUSES.CANCELLED
    ) {
      throw new Error('Can only delete draft or cancelled orders');
    }

    await ImportOrder.findByIdAndDelete(orderId);

    return { message: 'Import order deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status, approvalBy = null, bypassValidation = false) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Validate status transition (skip if bypassValidation is true for supervisor)
    if (!bypassValidation) {
      const validTransitions = {
        [IMPORT_ORDER_STATUSES.DRAFT]: [
          IMPORT_ORDER_STATUSES.APPROVED,
          IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.APPROVED]: [
          IMPORT_ORDER_STATUSES.DRAFT,
          IMPORT_ORDER_STATUSES.DELIVERED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.DELIVERED]: [
          IMPORT_ORDER_STATUSES.APPROVED,
          IMPORT_ORDER_STATUSES.CHECKED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.CHECKED]: [
          IMPORT_ORDER_STATUSES.DELIVERED,
          IMPORT_ORDER_STATUSES.ARRANGED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.ARRANGED]: [
          IMPORT_ORDER_STATUSES.CHECKED,
          IMPORT_ORDER_STATUSES.COMPLETED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.COMPLETED]: [],
        [IMPORT_ORDER_STATUSES.CANCELLED]: [],
      };

      if (!validTransitions[order.status].includes(status)) {
        throw new Error(`Cannot change status from ${order.status} to ${status}`);
      }
    }

    const updateData = { status };
    if (approvalBy) {
      updateData.approval_by = approvalBy;
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate({ path: 'contract_id', populate: { path: 'partner_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Get import orders by warehouse manager
const getImportOrdersByWarehouseManager = async (
  warehouseManagerId,
  query = {},
  page = 1,
  limit = 10,
  userRole = null
) => {
  try {
    const searchQuery = { ...query, warehouse_manager_id: warehouseManagerId };
    return await getImportOrders(searchQuery, page, limit, userRole);
  } catch (error) {
    throw error;
  }
};

// Get import orders by contract
const getImportOrdersByContract = async (contractId, userRole = null) => {
  try {
    const query = { contract_id: contractId };

    // Filter internal orders for Representative and Representative Manager
    if (userRole === 'representative' || userRole === 'representative_manager') {
      query.contract_id = { $ne: null }; // Chỉ hiển thị đơn có contract (không hiển thị đơn nội bộ)
    }

    const orders = await ImportOrder.find(query)
      .populate({ path: 'contract_id', populate: { path: 'partner_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code')
      .sort({ createdAt: -1 });

    return orders;
  } catch (error) {
    throw error;
  }
};

// Get valid status transitions for a given status
const getValidStatusTransitions = (currentStatus) => {
  const validTransitions = {
    [IMPORT_ORDER_STATUSES.DRAFT]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.APPROVED]: [
      IMPORT_ORDER_STATUSES.DRAFT,
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.DELIVERED]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.CHECKED]: [
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.ARRANGED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.ARRANGED]: [
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.COMPLETED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.COMPLETED]: [],
    [IMPORT_ORDER_STATUSES.CANCELLED]: [],
  };

  return validTransitions[currentStatus] || [];
};

// Get all status transitions mapping
const getAllStatusTransitions = () => {
  return {
    [IMPORT_ORDER_STATUSES.DRAFT]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.APPROVED]: [
      IMPORT_ORDER_STATUSES.DRAFT,
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.DELIVERED]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.CHECKED]: [
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.ARRANGED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.ARRANGED]: [
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.COMPLETED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.COMPLETED]: [],
    [IMPORT_ORDER_STATUSES.CANCELLED]: [],
  };
};

const assignWarehouseManager = async (orderId, warehouseManagerId) => {
  // 1. Check order exists
  const order = await ImportOrder.findById(orderId);
  if (!order) throw new Error('Import order not found');

  // 3. Check if already assigned
  if (order.warehouse_manager_id) {
    throw new Error('Warehouse manager has already been assigned to this order');
  }

  // 4. Validate warehouseManagerId is a valid user with correct role
  const user = await User.findById(warehouseManagerId);
  if (!user) {
    throw new Error('Warehouse manager user not found');
  }
  if (user.role !== USER_ROLES.WAREHOUSEMANAGER) {
    throw new Error('Assigned user is not a warehouse manager');
  }
  if (user.status !== 'active') {
    throw new Error('Warehouse manager user is not active');
  }

  order.warehouse_manager_id = warehouseManagerId;
  await order.save();


  return await ImportOrder.findById(orderId)
    .populate({
      path: 'contract_id',
      populate: [
        { path: 'partner_id', select: 'name' },
        { path: 'items.medicine_id', select: 'medicine_name license_code' }
      ],
    })
    .populate('warehouse_manager_id', 'name email role')
    .populate('created_by', 'name email role')
    .populate('approval_by', 'name email role')
    .populate('details.medicine_id', 'medicine_name license_code');
};

// Helper function to safely get manager id as string
function getManagerId(warehouse_manager_id) {
  if (!warehouse_manager_id) return null;
  if (typeof warehouse_manager_id === 'string' || typeof warehouse_manager_id === 'number') {
    return warehouse_manager_id.toString();
  }
  if (typeof warehouse_manager_id === 'object') {
    if (warehouse_manager_id._id) return warehouse_manager_id._id.toString();
    if (typeof warehouse_manager_id.toString === 'function') return warehouse_manager_id.toString();
  }
  return null;
}


async function createTranscriptionDocBuffer(importOrderId) {
  // fetch data
  const order = await getImportOrderById(importOrderId);
  const inspections = await getInspectionByImportOrderId(importOrderId);

  // helper formatters
  const currency = (value) =>
    value == null || value === 0 ? "" : new Intl.NumberFormat("vi-VN").format(value);
  const num = (v) => (v == null ? 0 : Number(v));

  // build maps from order details and inspections
  const orderDetailsMap = new Map();
  (order.details || []).forEach((d) => {
    const med = d.medicine_id || {};
    const id = String(med._id);
    orderDetailsMap.set(id, {
      id,
      name: med.medicine_name || "",
      license: med.license_code || "",
      unit: med.unit_of_measure || "",
      required: num(d.quantity || d.qty || 0),
      unit_price: num(d.unit_price || 0),
    });
  });

  // aggregate inspections by medicine id (sum of actual - rejected)
  const inspMap = new Map();
  (inspections || []).forEach((ins) => {
    const med = ins.medicine_id || {};
    const id = med._id ? String(med._id) : String(ins.medicine_id || "");
    const net = num(ins.actual_quantity) - num(ins.rejected_quantity);
    const prev = inspMap.get(id) || { actual: 0, name: med.medicine_name || "", unit: med.unit_of_measure || "" };
    prev.actual += net;
    // keep name/unit if missing from order
    if (!prev.name && med.medicine_name) prev.name = med.medicine_name;
    if (!prev.unit && med.unit_of_measure) prev.unit = med.unit_of_measure;
    inspMap.set(id, prev);
  });

  // order rows: keep order.details order first, then any inspection-only meds
  const orderedIds = [
    ...(order.details || []).map((d) => String((d.medicine_id && d.medicine_id._id) || d.medicine_id)),
    ...[...inspMap.keys()].filter((id) => !orderDetailsMap.has(id)),
  ];

  // dedupe while preserving order
  const seen = new Set();
  const finalIds = [];
  for (const id of orderedIds) {
    if (!seen.has(id) && id) {
      finalIds.push(id);
      seen.add(id);
    }
  }

  // create table helpers (H = header, C = cell)
  const H = (text, opts = {}) =>
    new TableCell({
      width: opts.width,
      rowSpan: opts.rowSpan,
      columnSpan: opts.columnSpan,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 120, right: 120 }, // padding
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true })],
        }),
      ],
    });

  const C = (text, opts = {}) =>
    new TableCell({
      width: opts.width,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun(String(text ?? ""))],
        }),
      ],
    });

  // build body rows from merged data
  let stt = 1;
  let grandTotal = 0;
  const bodyRows = finalIds.map((id) => {
    const od = orderDetailsMap.get(id);
    const insp = inspMap.get(id);

    const name = (od && od.name) || (insp && insp.name) || "";
    const license = (od && od.license) || "";
    const unit = (od && od.unit) || (insp && insp.unit) || "";
    const required = (od && od.required) || 0; // "Yêu cầu" from order.details
    const actual = (insp && insp.actual) || 0; // "Thực nhập" aggregated from inspections
    const unitPrice = (od && od.unit_price) || 0;
    const amount = unitPrice * actual;

    grandTotal += amount;

    return new TableRow({
      children: [
        C(String(stt++), { center: true }), // STT
        C(name),
        C(license, { center: true }), // Mã số
        C(unit, { center: true }), // ĐVT
        C(required === 0 ? "" : String(required), { center: true }), // Yêu cầu
        C(actual === 0 ? "" : String(actual), { center: true }), // Thực nhập
        C(unitPrice === 0 ? "" : currency(unitPrice), { center: true }), // Đơn giá
        C(amount === 0 ? "" : currency(amount), { center: true }), // Thành tiền
      ],
    });
  });

  // build the table with dynamic bodyRows
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      insideH: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      insideV: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    },

    rows: [
      // header row 1
      new TableRow({
        tableHeader: true,
        children: [
          H("STT", { width: { size: 6, type: WidthType.PERCENTAGE }, rowSpan: 2 }),
          H(
            "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hóa",
            { width: { size: 38, type: WidthType.PERCENTAGE }, rowSpan: 2 }
          ),
          H("Mã số", { width: { size: 7, type: WidthType.PERCENTAGE }, rowSpan: 2 }),
          H("Đơn vị tính", { width: { size: 7, type: WidthType.PERCENTAGE }, rowSpan: 2 }),
          H("Số lượng", { columnSpan: 2 }),
          H("Đơn giá", { width: { size: 10, type: WidthType.PERCENTAGE }, rowSpan: 2 }),
          H("Thành tiền", { width: { size: 12, type: WidthType.PERCENTAGE }, rowSpan: 2 }),
        ],
      }),
      // header row 2
      new TableRow({
        tableHeader: true,
        children: [
          H("Yêu cầu", { width: { size: 6, type: WidthType.PERCENTAGE } }),
          H("Thực nhập", { width: { size: 6, type: WidthType.PERCENTAGE } }),
        ],
      }),
      // A/B/C... row removed in this build (you can add if still needed)
      // bodyRows...
      ...bodyRows,
      // total row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Cộng", bold: true })],
              }),
            ],
          }),
          C(grandTotal === 0 ? "" : currency(grandTotal)),
        ],
      }),
    ],
  });

  // header table (2 columns) - no borders
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, color: "FFFFFF" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "CÔNG TY CỔ PHẦN",
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, color: "FFFFFF" },
            },
            children: [
              // right side: Mẫu số + italic notes
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Mẫu số: 01 - VT",
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "(Ban hành theo Thông tư số 133/2016/TT-BTC",
                    italics: true,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Ngày 26/08/2016 của Bộ Tài chính)",
                    italics: true,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // signature table (borderless) - reuse earlier sigCell-like structure
  const sigCell = (title) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE }, // 4 equal parts
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: title, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "(Ký, họ tên)", italics: true })],
        }),
      ],
    });

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [sigCell("Người lập biểu"), sigCell("Người giao hàng"), sigCell("Thủ kho"), sigCell("Kế toán trưởng")],
      }),
    ],
  });

  // fill metadata
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const partnerName = (order.contract_id && order.contract_id.partner_id && order.contract_id.partner_id.name) || "";
  const orderIdString = String(order._id || "");

  // build final document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          headerTable,
          new Paragraph({
            children: [new TextRun({ text: "PHIẾU NHẬP KHO", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun(`Ngày ${day} tháng ${month} năm ${year}`)],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Số: ${orderIdString}` })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: `- Họ và tên người giao: ${partnerName}` })],
          }),
          new Paragraph({ children: [new TextRun("- Theo số hóa đơn số:  ")] }),
          new Paragraph({ children: [new TextRun("- Nhập tại kho: ")] }),
          new Paragraph({ children: [new TextRun("- Địa điểm:")] , spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Bảng chi tiết hàng hóa:", bold: true })], spacing: { after: 120 } }),
          table,
          new Paragraph({ children: [new TextRun(`- Tổng số tiền (Viết bằng chữ):  `)], spacing: { before: 200, after: 200 } }),
          new Paragraph({ children: [new TextRun("- Số chứng từ gốc kèm theo: ")], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({text: "Ngày ..... tháng ..... năm ..... ", italics: true})], spacing: { after: 120 }, alignment: AlignmentType.END }),
          sigTable,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

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
  getAllStatusTransitions,
  assignWarehouseManager,
  createTranscriptionDocBuffer,
};
