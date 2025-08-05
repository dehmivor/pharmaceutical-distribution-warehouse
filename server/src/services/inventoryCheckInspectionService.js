const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const InventoryCheckOrder = require('../models/InventoryCheckOrder');
const PackageService = require("./packageService")

const getInspectionsByOrderId = async (orderId) => {
  // 1) Ensure order exists (throws if not found)
  const order = await InventoryCheckOrder.findById(orderId);
  if (!order) {
    const err = new Error('Inventory check order not found');
    err.statusCode = 404;
    throw err;
  }

  // 2) Query inspections with nested populates
  const inspections = await InventoryCheckInspection
    .find({ inventory_check_order_id: orderId })
    // exclude the check_list field
    .select('-check_list')
    .populate({
      path: 'location_id',
      select: 'area_id bay row column',
      populate: {
        path: 'area_id',
        model: 'Area',
        select: 'name'
      }
    })
    .lean();

  return inspections;
}

const changeInspectionStatus = async (inspectionId, newStatus) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId);
  if (!inspection) {
    const err = new Error('Inspection not found');
    err.statusCode = 404;
    throw err;
  }

  inspection.status = newStatus;
  await inspection.save();
  return inspection;
}

const addCheckBy = async (inspectionId, userId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId);
  if (!inspection) {
    const err = new Error('Inspection not found');
    err.statusCode = 404;
    throw err;
  }

  inspection.check_by = userId;
  await inspection.save();
  return inspection;
}

const createInitialCheckItem = async (inspectionId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId);
  if (!inspection) {
    const err = new Error('Inspection not found');
    err.statusCode = 404;
    throw err;
  }

  // call the helper and destructure
  const { success, packages, message } = await PackageService.getPackagesByLocation(
    inspection.location_id
  );
  if (!success) {
    const err = new Error(message || 'Failed to fetch packages');
    err.statusCode = 400;
    throw err;
  }

  // now packages is your array
  let added = 0;
  for (const pkg of packages) {
    const exists = inspection.check_list.some(
      item => item.package_id.toString() === pkg._id.toString()
    );
    if (!exists) {
      inspection.check_list.push({
        package_id: pkg._id,
        expected_quantity: pkg.quantity,
        actual_quantity: pkg.quantity,
        type: 'valid',
      });
      added++;
    }
  }

  if (added > 0) {
    await inspection.save();
  }

  return inspection;
}

const getCheckItemsByInspectionId = async(inspectionId) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId)
  .populate({
    path : 'check_list.package_id',
    select: 'batch_id',
    populate: {
        path: 'batch_id',
        select: 'medicine_id batch_code',
        populate: {
          path : 'medicine_id',
          select : 'medicine_name license_code'
        }
      }
  });
  if (!inspection) {
    const err = new Error('Inspection not found');
    err.statusCode = 404;
    throw err;
  }
  return inspection.check_list;
}

const upsertCheckItem = async(inspectionId, item) => {
  const inspection = await InventoryCheckInspection.findById(inspectionId);
  if (!inspection) {
    const err = new Error('Inspection not found');
    err.statusCode = 404;
    throw err;
  }

  // Find existing by package_id
  const existing = inspection.check_list.find(ci =>
    ci.package_id.toString() === item.package_id
  );

  if (existing) {
    // Update fields
    existing.expected_quantity = item.expected_quantity;
    existing.actual_quantity   = item.actual_quantity;
    existing.type              = item.type || existing.type;
  } else {
    // Push new
    inspection.check_list.push({
      package_id:       item.package_id,
      expected_quantity: item.expected_quantity,
      actual_quantity:   item.actual_quantity,
      type:              item.type || 'valid',
    });
  }

  await inspection.save();
  return inspection;
}



module.exports = {
  getInspectionsByOrderId,
  changeInspectionStatus,
  addCheckBy,
  createInitialCheckItem,
  getCheckItemsByInspectionId,
  upsertCheckItem
};



