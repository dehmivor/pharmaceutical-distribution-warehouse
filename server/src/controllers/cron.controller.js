const checkLowInventory = require('../services/cron.service');

const runCheckLowInventory = async (req, res) => {
  try {
    const result = await checkLowInventory();
    res.json({ message: 'Tác vụ đã thực hiện xong.', result });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra!', error: error.message });
  }
};

module.exports = {
  runCheckLowInventory,
};
