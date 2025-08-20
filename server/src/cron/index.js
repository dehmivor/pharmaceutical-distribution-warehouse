const startInventoryJob = require('./inventoryJob');
const { startAITrendsJob } = require('./aiTrendsJob');

function startAllCrons() {
  startInventoryJob();
  startAITrendsJob();
}

module.exports = startAllCrons;
