const ExportOrder = require('../models/ExportOrder');
const { EXPORT_ORDER_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');
const contractService = require('./contractService');
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

// Định nghĩa populateOptions thống nhất
const populateOptions = [
  {
    path: 'contract_id',
    populate: [
      { path: 'partner_id', select: 'name' },
      { path: 'items.medicine_id', select: 'medicine_name license_code' },
    ],
  },
  { path: 'warehouse_manager_id', select: 'name email role' },
  { path: 'created_by', select: 'name email role' },
  { path: 'approval_by', select: 'name email role' },
  { path: 'details.medicine_id', select: 'medicine_name license_code unit_of_measure' }, // Thêm unit_of_measure
  {
    path: 'details.actual_item.package_id',
    select: 'package_code quantity',
    populate: [
      { path: 'batch_id', select: 'batch_code expiry_date' },
      { path: 'location_id', select: 'area_name bay row column' }
    ]
  }, // Populate đầy đủ package với batch và location
  { path: 'details.actual_item.created_by', select: 'email' }, // Thêm nếu cần
];

/**
 * Representative tạo export order (luôn trạng thái draft)
 * @param {Object} data - Dữ liệu export order
 * @param {String} userId - ID người tạo
 * @returns {Promise<ExportOrder>}
 */
async function createExportOrder(data, userId) {
  const { created_by, details, ...rest } = data;
  let finalDetails = details || [];

  // Nếu không có details hoặc details rỗng, cần contract_id để auto-generate
  if (!Array.isArray(finalDetails) || finalDetails.length === 0) {
    if (!rest.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }

    // Kiểm tra contract phải là Retailer contract
    const Contract = require('../models/Contract');
    const contract = await Contract.findById(rest.contract_id);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (contract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }

    const contractState = await contractService.getCurrentContractState(rest.contract_id);
    finalDetails = (contractState.current_items || []).map((item) => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
    }));
  }

  const order = new ExportOrder({
    ...rest,
    details: finalDetails,
    status: EXPORT_ORDER_STATUSES.DRAFT,
    created_by: userId,
  });

  const savedOrder = await order.save();

  return await ExportOrder.findById(savedOrder._id).populate(populateOptions);
}

/**
 * Warehouse Manager tạo export order nội bộ (không contract) – tự động approved
 * @param {{contract_id?: null, details: Array}} data
 * @param {String} userId
 */
async function createInternalExportOrder(data, userId) {
  const { details = [] } = data || {};
  if (!Array.isArray(details) || details.length === 0) {
    throw new Error('Details are required to create internal export order');
  }

  const order = new ExportOrder({
    contract_id: null,
    details,
    status: EXPORT_ORDER_STATUSES.APPROVED,
    created_by: userId,
  });

  const saved = await order.save();
  return await ExportOrder.findById(saved._id).populate(populateOptions);
}

/**
 * RM duyệt export order (chỉ chuyển trạng thái sang approved)
 * @param {String} orderId - ID export order
 * @param {String} rmId - ID RM duyệt
 * @returns {Promise<ExportOrder>}
 */
async function approveExportOrder(orderId, rmId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== 'draft') {
    throw new Error('Only draft orders can be approved');
  }
  order.status = EXPORT_ORDER_STATUSES.APPROVED;
  order.approval_by = rmId;
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * RM từ chối export order (chuyển trạng thái sang rejected)
 * @param {String} orderId - ID export order
 * @param {String} rmId - ID RM từ chối
 * @returns {Promise<ExportOrder>}
 */
async function rejectExportOrder(orderId, rmId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== 'draft') {
    throw new Error('Only draft orders can be rejected');
  }
  order.status = EXPORT_ORDER_STATUSES.REJECTED;
  order.approval_by = rmId;
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}


/**
 * Get export order by ID with full population
 * @param {String} orderId - ID export order
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderById(orderId) {
  const order = await ExportOrder.findById(orderId).populate(populateOptions);
  if (!order) {
    throw new Error('Export order not found');
  }
  return order;
}

/**
 * Get all export orders with pagination and filters
 * @param {Object} params - Filter parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function getExportOrders(params = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = {};

  if (params.status) {
    query.status = params.status;
  }

  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  if (params.created_by) {
    query.created_by = params.created_by;
  }

  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
      .populate(populateOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    ExportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
}

/**
 * Get export orders with filters
 * @param {Object} params - Filter parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function getExportOrdersFilter(params = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = {};

  if (params.status) {
    query.status = params.status;
  }

  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  if (params.createdAt) {
    const start = new Date(params.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  if (params.created_by) {
    if (mongoose.Types.ObjectId.isValid(params.created_by)) {
      query.created_by = new mongoose.Types.ObjectId(params.created_by);
    }
  }

  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
      .populate(populateOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    ExportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
}

/**
 * Xóa export order
 * @param {String} orderId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
async function deleteExportOrder(orderId, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (![EXPORT_ORDER_STATUSES.DRAFT, EXPORT_ORDER_STATUSES.CANCELLED].includes(order.status)) {
    throw new Error('Can only delete draft or cancelled export orders');
  }
  if (user.role === 'representative' && order.created_by.toString() !== user.userId) {
    throw new Error('You can only delete your own export orders');
  }
  await ExportOrder.findByIdAndDelete(orderId);
  return { success: true, message: 'Export order deleted successfully' };
}

/**
 * Cập nhật export order
 * @param {String} orderId
 * @param {Object} updateData
 * @param {Object} user
 * @returns {Promise<ExportOrder>}
 */
async function updateExportOrder(orderId, updateData, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');

  // Representative chỉ có thể sửa draft hoặc rejected orders
  if (!['draft', 'rejected'].includes(order.status)) {
    throw new Error('Can only update draft or rejected export orders');
  }

  // Representative chỉ có thể sửa orders của mình
  if (user.role !== 'representative' || order.created_by.toString() !== user.userId) {
    throw new Error('You can only update your own export orders');
  }

  // Set currentUser context cho validation middleware
  order.currentUser = user;

  // Nếu đang sửa rejected order, tự động chuyển về draft
  if (order.status === 'rejected') {
    order.status = EXPORT_ORDER_STATUSES.DRAFT;
    order.approval_by = undefined;
  }

  let details = updateData.details;
  if (!Array.isArray(details) || details.length === 0) {
    if (!updateData.contract_id && !order.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }
    const contractId = updateData.contract_id || order.contract_id;

    // Kiểm tra contract phải là Retailer contract
    const Contract = require('../models/Contract');
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (contract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }

    const contractState = await contractService.getCurrentContractState(contractId);
    details = (contractState.current_items || []).map((item) => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
    }));
  }

  if (updateData.contract_id) {
    // Kiểm tra contract mới cũng phải là Retailer contract
    const Contract = require('../models/Contract');
    const newContract = await Contract.findById(updateData.contract_id);
    if (!newContract) {
      throw new Error('New contract not found');
    }
    if (newContract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }
    order.contract_id = updateData.contract_id;
  }

  order.details = details;
  await order.save();
  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * Get export order detail
 * @param {String} id
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderDetail(id) {
  const exportOrder = await ExportOrder.findById(id).populate(populateOptions);
  if (!exportOrder) {
    throw new Error('Export order not found');
  }
  return exportOrder;
}

/**
 * Thêm export inspection
 * @param {String} orderId
 * @param {String} detailId
 * @param {Object} inspectionData
 * @returns {Promise<Object>}
 */
async function addExportInspection(orderId, detailId, inspectionData) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid orderId');
  }
  if (!mongoose.Types.ObjectId.isValid(detailId)) {
    throw new Error('Invalid detailId');
  }

  const order = await ExportOrder.findById(orderId);
  if (!order) {
    const err = new Error('Export order not found');
    err.status = 404;
    throw err;
  }

  const detail = order.details.id(detailId);
  if (!detail) {
    const err = new Error('Export order detail not found');
    err.status = 404;
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(inspectionData.package_id)) {
    throw new Error('Invalid package_id');
  }

  detail.actual_item.push({
    package_id: inspectionData.package_id,
    quantity: inspectionData.quantity,
    created_by: inspectionData.created_by,
  });

  await order.save();
  return detail.actual_item[detail.actual_item.length - 1];
}



/**
 * Kiểm tra tồn kho cho export order
 * @param {Array} details - Chi tiết export order
 * @returns {Promise<Object>} - Kết quả kiểm tra tồn kho
 */
async function checkStockAvailability(details) {
  try {
    const Batch = require('../models/Batch');
    const Package = require('../models/Package');
    const Medicine = require('../models/Medicine');

    const stockCheckResults = [];

    for (const detail of details) {
      const { medicine_id, expected_quantity } = detail;

      // Lấy thông tin thuốc
      const medicine = await Medicine.findById(medicine_id).select('medicine_name license_code');
      if (!medicine) {
        stockCheckResults.push({
          medicine_id,
          medicine_name: 'Unknown',
          license_code: 'Unknown',
          expected_quantity,
          available_quantity: 0,
          is_available: false,
          error: 'Medicine not found'
        });
        continue;
      }

      // Tìm tất cả batch của thuốc này còn hạn trên 1 năm
      const currentDate = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const validBatches = await Batch.find({
        medicine_id,
        expiry_date: {
          $gt: oneYearFromNow // Chỉ lấy batch còn hạn trên 1 năm
        }
      }).lean();

      if (validBatches.length === 0) {
        stockCheckResults.push({
          medicine_id,
          medicine_name: medicine.medicine_name,
          license_code: medicine.license_code,
          expected_quantity,
          available_quantity: 0,
          is_available: false,
          error: 'No valid batches found (all batches expired or expiring within 1 year)'
        });
        continue;
      }

      const validBatchIds = validBatches.map(batch => batch._id);

      // Tính tổng số lượng có sẵn từ các package của batch còn hạn trên 1 năm
      const packages = await Package.find({
        batch_id: { $in: validBatchIds }
      }).lean();

      const availableQuantity = packages.reduce((sum, pkg) => sum + (pkg.quantity || 0), 0);

      // Thêm thông tin về batch còn hạn
      const validBatchInfo = validBatches.map(batch => ({
        batch_code: batch.batch_code,
        expiry_date: batch.expiry_date,
        days_until_expiry: Math.ceil((batch.expiry_date - currentDate) / (1000 * 60 * 60 * 24))
      }));

      stockCheckResults.push({
        medicine_id,
        medicine_name: medicine.medicine_name,
        license_code: medicine.license_code,
        expected_quantity,
        available_quantity: availableQuantity,
        is_available: availableQuantity >= expected_quantity,
        error: availableQuantity >= expected_quantity ? null : 'Insufficient stock',
        valid_batches: validBatchInfo,
        total_valid_batches: validBatches.length
      });
    }

    const allAvailable = stockCheckResults.every(result => result.is_available);
    const insufficientItems = stockCheckResults.filter(result => !result.is_available);

    return {
      success: true,
      data: {
        all_available: allAvailable,
        stock_check_results: stockCheckResults,
        insufficient_items: insufficientItems,
        total_items: stockCheckResults.length,
        available_items: stockCheckResults.filter(result => result.is_available).length
      }
    };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      success: false,
      message: 'Error checking stock availability',
      error: error.message
    };
  }
}

async function assignWarehouseManager(orderId, warehouseManagerId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  order.warehouse_manager_id = warehouseManagerId;
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * Get export order by ID with full population
 * @param {String} orderId - ID export order
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderById(orderId) {
  const order = await ExportOrder.findById(orderId).populate(populateOptions);
  if (!order) {
    throw new Error('Export order not found');
  }
  return order;
}

async function getExportedTotalsLast6Months() {
  const now = new Date();
  // start at first day of month 5 months ago (so total 6 months including current)
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  // aggregation pipeline
  const pipeline = [
    {
      $match: {
        status: EXPORT_ORDER_STATUSES.COMPLETED || 'completed',
        updatedAt: { $gte: startMonth, $lte: now },
      },
    },

    // unwind details array
    { $unwind: '$details' },

    // unwind actual_item (inspect entries). preserveNull so orders with no actual_item don't crash
    { $unwind: { path: '$details.actual_item', preserveNullAndEmptyArrays: true } },

    // group by medicine id in the detail and sum the exported quantity from actual_item.quantity
    {
      $group: {
        _id: '$details.medicine_id',
        totalExported: {
          // sum quantity, fallback to 0 if missing
          $sum: { $ifNull: ['$details.actual_item.quantity', 0] },
        },
      },
    },

    // join with medicines collection to get name/license (optional but helpful)
    {
      $lookup: {
        from: 'medicines', // collection name (usually the lowercase plural of model)
        localField: '_id',
        foreignField: '_id',
        as: 'medicine',
      },
    },
    { $unwind: { path: '$medicine', preserveNullAndEmptyArrays: true } },

    // project final shape
    {
      $project: {
        _id: 0,
        medicine_id: '$_id',
        medicine_name: { $ifNull: ['$medicine.medicine_name', null] },
        license_code: { $ifNull: ['$medicine.license_code', null] },
        totalExported: 1,
      },
    },

    // sort by total descending
    { $sort: { totalExported: -1 } },
    { $limit: 5 },
  ];

  const results = await ExportOrder.aggregate(pipeline).exec();

  return {
    meta: {
      since: startMonth.toISOString(),
      until: now.toISOString(),
    },
    data: results,
  };
};

async function createTranscriptionDocBuffer(exportOrderId) {
  // fetch order
  const order = await getExportOrderDetail(exportOrderId);

  // helpers
  const num = (v) => (v == null ? 0 : Number(v));
  const currency = (v) => (v == null || v === 0 ? "" : new Intl.NumberFormat("vi-VN").format(v));

  // build row data from order.details
  // Each detail:
  // expected_quantity -> Yêu cầu
  // actual_item -> array of { quantity } -> Thực nhập = sum(quantity)
  const rowsData = (order.details || []).map((d) => {
    const med = d.medicine_id || {};
    const expected = num(d.expected_quantity || d.quantity || 0);
    const actual = Array.isArray(d.actual_item) && d.actual_item.length > 0
      ? d.actual_item.reduce((s, it) => s + num(it.quantity), 0)
      : 0;
    const unitPrice = num(d.unit_price || 0);
    const amount = unitPrice * actual;
    return {
      id: med._id ? String(med._id) : "",
      name: med.medicine_name || "",
      license: med.license_code || "",
      unit: med.unit_of_measure || "",
      expected,
      actual,
      unitPrice,
      amount,
    };
  });

  // table cell helpers
  const H = (text, opts = {}) =>
    new TableCell({
      width: opts.width,
      rowSpan: opts.rowSpan,
      columnSpan: opts.columnSpan,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
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

  // build body rows and compute total
  let stt = 1;
  let grandTotal = 0;
  const bodyRows = rowsData.map((r) => {
    grandTotal += r.amount;
    return new TableRow({
      children: [
        C(String(stt++), { center: true }), // STT
        C(r.name),
        C(r.license, { center: true }), // Mã số
        C(r.unit, { center: true }), // ĐVT
        C(r.expected === 0 ? "" : String(r.expected), { center: true }), // Yêu cầu
        C(r.actual === 0 ? "" : String(r.actual), { center: true }), // Thực nhập
        C(r.unitPrice === 0 ? "" : currency(r.unitPrice), { center: true }), // Đơn giá
        C(r.amount === 0 ? "" : currency(r.amount), { center: true }), // Thành tiền
      ],
    });
  });

  // main table (headers + body + total)
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
        children: [H("Yêu cầu", { width: { size: 6, type: WidthType.PERCENTAGE } }), H("Thực xuất", { width: { size: 6, type: WidthType.PERCENTAGE } })],
      }),
      // optional A/B/C row omitted (keep clean)
      // body
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

  // header table (two columns, borderless)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, color: "FFFFFF" },
      insideH: { style: BorderStyle.NONE, color: "FFFFFF" },
      insideV: { style: BorderStyle.NONE, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: { style: BorderStyle.NONE, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, color: "FFFFFF" }, left: { style: BorderStyle.NONE, color: "FFFFFF" }, right: { style: BorderStyle.NONE, color: "FFFFFF" } },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: "CÔNG TY CỔ PHẦN", bold: true, size: 28 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: { style: BorderStyle.NONE, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, color: "FFFFFF" }, left: { style: BorderStyle.NONE, color: "FFFFFF" }, right: { style: BorderStyle.NONE, color: "FFFFFF" } },
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Mẫu số: 02 - VT", bold: true, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "(Ban hành theo Thông tư số 200/2014/TT-BTC", italics: true, size: 18 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Ngày 22/12/2016 của Bộ Tài chính)", italics: true, size: 18 })] }),
            ],
          }),
        ],
      }),
    ],
  });

  // signature table (borderless)
  const sigCell = (title) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: { style: BorderStyle.NONE, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, color: "FFFFFF" }, left: { style: BorderStyle.NONE, color: "FFFFFF" }, right: { style: BorderStyle.NONE, color: "FFFFFF" } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, họ tên)", italics: true })] }),
      ],
    });

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, color: "FFFFFF" }, left: { style: BorderStyle.NONE, color: "FFFFFF" }, right: { style: BorderStyle.NONE, color: "FFFFFF" }, insideH: { style: BorderStyle.NONE, color: "FFFFFF" }, insideV: { style: BorderStyle.NONE, color: "FFFFFF" } },
    rows: [new TableRow({ children: [sigCell("Người lập phiếu"), sigCell("Thủ kho"), sigCell("Bộ phận có nhu cầu nhập"), sigCell("Phó giám đốc") ] })],
  });

  // metadata
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const partnerName = (order.contract_id && order.contract_id.partner_id && order.contract_id.partner_id.name) || "";
  const orderIdString = String(order._id || "");

  // build document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          headerTable,
          new Paragraph({ children: [new TextRun({ text: "PHIẾU XUẤT KHO", bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun(`Ngày ${day} tháng ${month} năm ${year}`)], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Số: ${orderIdString}` })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `- Họ và tên người nhận hàng: ${partnerName}` })] }),
          new Paragraph({ children: [new TextRun({ text: `- Địa chỉ (bộ phận): ${order.contract_id && order.contract_id.partner_id ? "" : "" }` })] }),
          new Paragraph({ children: [new TextRun({ text: `- Lý do xuất kho: Bán Hàng` })] }),
          new Paragraph({ children: [new TextRun({ text: `- Xuất tại kho(ngăn lô):` })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Bảng chi tiết hàng hóa:", bold: true })], spacing: { after: 120 } }),
          table,
          new Paragraph({ children: [new TextRun({ text: `- Tổng số tiền (Viết bằng chữ): ` })], spacing: { before: 200, after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "- Số chứng từ gốc kèm theo: " })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({text: "Ngày ..... tháng ..... năm ..... ", italics: true})], spacing: { after: 120 }, alignment: AlignmentType.END }),
          sigTable,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}




module.exports = {
  createExportOrder,
  getExportOrdersFilter,
  approveExportOrder,
  rejectExportOrder, // Thêm function reject
  getExportOrderById,
  getExportOrders,
  deleteExportOrder,
  updateExportOrder,
  getExportOrderDetail,
  addExportInspection,
  checkStockAvailability,
  assignWarehouseManager, // Thêm function mới
  createInternalExportOrder, // Thêm function mới
  getExportedTotalsLast6Months,
  createTranscriptionDocBuffer
};