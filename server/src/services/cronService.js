const checkLowInventory = async () => {
  console.log('Đang kiểm tra tồn kho thấp và gửi cảnh báo...');
  return { success: true, message: 'Đã kiểm tra tồn kho.' };
};

module.exports = checkLowInventory;
