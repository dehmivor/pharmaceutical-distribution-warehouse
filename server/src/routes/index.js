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
  importInspectionRoutes : require('./importInspectionRoute'),
  thingsboardRoutes: require('./thingsboardRoute'),
  supplierContractRoutes: require('./supplierContractRoute'),
  // warehouseRoutes: require('./warehouseRoute'),
  // presentativeRoutes: require('./presentativeRoute'),
  // retailerRoutes: require('./retailerRoute'),
  // supplierRoutes: require('./supplierRoute'),
};
