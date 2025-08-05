const { getInspectionsByOrderId, changeInspectionStatus, addCheckBy, createInitialCheckItem,getCheckItemsByInspectionId, upsertCheckItem } = require('../services/inventoryCheckInspectionService');

const getInspectionsByOrderIdController = async (req, res) => {
  const { orderId } = req.params;
  try {
    const inspections = await getInspectionsByOrderId(orderId);
    return res.json({ success: true, data: inspections });
  } catch (err) {
    console.error('Error fetching inspections:', err);
    const status = err.statusCode || 500;
    const message = err.message || 'Server error';
    return res.status(status).json({ success: false, error: message });
  }
};

const updateInspectionStatus = async (req, res) => {
  const { inspectionId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    const updated = await changeInspectionStatus(inspectionId, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
};


const setInspectionChecker = async (req, res) => {
  const { inspectionId } = req.params;
  const { checkBy } = req.body;

  if (!checkBy) {
    return res.status(400).json({ success: false, error: 'checkBy userId is required' });
  }

  try {
    const updated = await addCheckBy(inspectionId, checkBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

const initializeCheckItems = async (req, res) => {
  const { inspectionId } = req.params;
  try {
    const updated = await createInitialCheckItem(inspectionId);
    res.json({ success: true, data: updated });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

const getCheckItems = async (req, res) => {
  try {
    const items = await getCheckItemsByInspectionId(req.params.inspectionId);
    res.json({ success: true, data: items });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

const updateCheckItem = async (req, res) => {
  const { inspectionId } = req.params;
  const { package_id, expected_quantity, actual_quantity, type } = req.body;

  if (!package_id || expected_quantity == null || actual_quantity == null) {
    return res.status(400).json({
      success: false,
      error: 'package_id, expected_quantity and actual_quantity are required'
    });
  }

  try {
    const updatedInspection = await upsertCheckItem(inspectionId, {
      package_id,
      expected_quantity,
      actual_quantity,
      type,
    });
    res.json({ success: true, data: updatedInspection });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};


module.exports = {
  getInspectionsByOrderIdController,
  updateInspectionStatus,
  setInspectionChecker,
  initializeCheckItems,
  getCheckItems,
  updateCheckItem
}; 