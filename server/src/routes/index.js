// routes/index.js
module.exports = {
  authRoutes: require('./authRoute'),
  cronRoutes: require('./cronRoute'),
  medicineRoutes: require('./medicineRoute'),
  supervisorRoutes: require('./supervisorRoute'),
  packageRoutes: require('./packageRoute'),
  importOrderRoutes: require('./importOrderRoutes'),
  notificationRoutes: require('./notificationRoute'),
  accountRoutes: require('./accountRoute'),
  thingsboardRoutes: require('./thingsboardRoute'),
  importInspectionRoutes: require('./importInspectionRoute'),
  supplierContractRoutes: require('./supplierContractRoute'),
  inspectionRoutes: require('./inspectionRoute'),
  stripeRoutes: require('./stripeRoute'),
};
