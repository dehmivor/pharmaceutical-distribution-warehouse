const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const InventoryCheckOrder = require('../models/InventoryCheckOrder');

const getInspectionsByOrderId = async(orderId) => {
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
    .populate({
      path: 'location_id',
      select: 'area_id bay row column',
      populate: {
        path: 'area_id',
        model: 'Area',
        select: 'name'
      }
    })
    .populate({
      path: 'check_list.medicine_id',
      model: 'Medicine',
      select: '_id license_code medicine_name'
    })
    .lean();

  return inspections;
}

const changeInspectionStatus = async(inspectionId, newStatus) => {
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

const addCheckBy = async(inspectionId, userId) => {
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


module.exports = {
  getInspectionsByOrderId,
  changeInspectionStatus,
  addCheckBy
};



