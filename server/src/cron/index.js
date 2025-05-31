const startInventoryJob = require('./inventoryJob');
const startReportJob = require('./reportJob');

function startAllCrons() {
  startInventoryJob();
  startReportJob();
}

module.exports = startAllCrons;
