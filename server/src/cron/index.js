const startInventoryJob = require('./inventoryJob');

function startAllCrons() {
  startInventoryJob();
}

module.exports = startAllCrons;
