const authService = require('./authService');
const cronService = require('./cronService');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const thingsboardService = require('./thingsboardService');
const importOrderService = require('./importOrderService');
const inspectionService = require('./inspectionService');
const medicineService = require('./medicineService');
const packageService = require('./packageService');
const stripeService = require('./stripeService');
const billService = require('./billService');
const supplierContractService = require('./supplierContractService');

let mailtrapService = {};

const loadMailtrap = async () => {
  try {
    const module = await import('./mailtrapService.js');
    mailtrapService = module.default || module;
  } catch (e) {
    console.error('Mailtrap load error:', e);
  }
};

module.exports = new Promise(async (resolve) => {
  await loadMailtrap();

  resolve({
    ...mailtrapService,
    ...authService,
    ...cronService,
    ...emailService,
    ...notificationService,
    ...thingsboardService,
    ...importOrderService,
    ...inspectionService,
    ...medicineService,
    ...packageService,
    ...stripeService,
    ...supplierContractService,
    ...billService,
  });
});
