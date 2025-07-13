const billService = require('../services/billService');

const billController = {
  getAllBills: async (req, res) => {
    try {
      const response = await billService.getAllBills();

      res.status(200).json({
        success: true,
        data: response.data,
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
};

module.exports = billController;
