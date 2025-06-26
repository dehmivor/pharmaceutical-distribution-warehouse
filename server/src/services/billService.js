const Bill = require('../models');

const getAllBills = async () => async (req, res) => {
  try {
    const bills = await Bill.find();

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBills,
};
