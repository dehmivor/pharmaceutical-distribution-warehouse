const inventoryService = require('../services/inventoryService');

const getInspectionsFromCheckOrder = async (req, res) => {
  try {
    const checkOrderId = req.params.id;

    const inspections = await inventoryService.getInspectionsFromCheckOrder(checkOrderId);

    if (!inspections || inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No inspections found for this order',
      });
    }

    return res.json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching inspections',
    });
  }
};

module.exports = {
  getInspectionsFromCheckOrder,
};
