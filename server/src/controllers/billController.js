const billService = require('../services/billService');

const billController = {
  getAllBills: async (req, res) => {
    try {
      const bills = await billService.getAllBills();

      res.status(200).json({
        success: true,
        data: bills,
        message: 'Bills retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bills',
        error: error.message,
      });
    }
  },
  getBillById: async (req, res) => {
    try {
      const billId = req.params.id;
      const bill = await billService.getBillById(billId);
      res.status(200).json({
        success: true,
        data: bill,
        message: 'Bill retrieved successfully',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Bill not found',
        error: error.message,
      });
    }
  },
  createBill: async (req, res) => {
    try {
      const billData = req.body;
      const newBill = await billService.createBill(billData);
      res.status(201).json({
        success: true,
        data: newBill,
        message: 'Bill created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create bill',
        error: error.message,
      });
    }
  },
  deleteBill: async (req, res) => {
  try {
    const billId = req.params.id;
    await billService.deleteBill(billId);
    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Bill not found',
      error: error.message,
    });
  }
},
};

module.exports = billController;
