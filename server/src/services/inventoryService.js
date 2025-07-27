const InventoryCheckInspection = require('../models/InventoryCheckInspection');

const getInspectionsFromCheckOrder = async (checkOrderId) => {
  try {
    const inspections = await InventoryCheckInspection.find({
      inventory_check_order_id: checkOrderId,
    });
    return inspections;
  } catch (error) {
    console.error('Error fetching inspections in service:', error);
    throw error;
  }
};

module.exports = {
  getInspectionsFromCheckOrder,
};
