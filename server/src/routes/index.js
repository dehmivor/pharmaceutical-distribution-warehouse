// routes/index.js
module.exports = {
  authRoutes: require('./authRoute'),
  cronRoutes: require('./cronRoute'),
  medicineRoutes: require('./medicineRoute'),
  supervisorRoutes: require('./supervisorRoute'),
  packageRoutes: require('./packageRoute'),
  importOrderRoutes: require('./importOrderRoute'),
  notificationRoutes: require('./notificationRoute'),
  accountRoutes: require('./accountRoute'),
  thingsboardRoutes: require('./thingsboardRoute'),
  // warehouseRoutes: require('./warehouseRoute'),
  // presentativeRoutes: require('./presentativeRoute'),
  // retailerRoutes: require('./retailerRoute'),
  // supplierRoutes: require('./supplierRoute'),
};
