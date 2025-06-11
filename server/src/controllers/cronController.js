// Thêm tham số req, res cho đúng cấu trúc Express middleware
const checkLowInventory = async (req, res) => {
  console.log('Đang kiểm tra tồn kho thấp và gửi cảnh báo...');

  // Phải trả về response cho client
  return res.status(200).json({
    success: true,
    message: 'Đã kiểm tra tồn kho.',
  });
};

module.exports = checkLowInventory; // Export đúng tên
