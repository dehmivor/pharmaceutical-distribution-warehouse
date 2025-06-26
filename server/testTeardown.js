const mongoose = require('mongoose');

module.exports = async () => {
  // Đóng kết nối MongoDB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Đóng các timer còn tồn tại
  const activeTimers = Object.values(global).filter((v) => typeof v?.unref === 'function');
  activeTimers.forEach((timer) => timer.unref());
};
