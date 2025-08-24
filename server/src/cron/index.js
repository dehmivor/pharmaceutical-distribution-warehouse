const startInventoryJob = require('./inventoryJob');
const { startAITrendsJob } = require('./aiTrendsJob');
const { startReminderEmailJob } = require('./reminderEmailJob');

function startAllCrons() {
  startInventoryJob();
  startAITrendsJob();
  startReminderEmailJob();
}

module.exports = startAllCrons;
