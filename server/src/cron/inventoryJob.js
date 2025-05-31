const cron = require('node-cron');
const inventoryService = require('../services/inventoryService');

function startInventoryJob() {
  cron.schedule('0 7 * * *', async () => {
    console.log('Cron: Kiểm tra tồn kho lúc 7h sáng');
    await inventoryService.checkLowInventory();
  });
}

module.exports = startInventoryJob;
