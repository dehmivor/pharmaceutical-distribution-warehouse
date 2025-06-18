// routes/index.js
module.exports = {
  authRoutes: require('./authRoute'),
  cronRoutes: require('./cronRoute'),
  medicineRoutes: require('./medicineRoute'),
  supervisorRoutes: require('./supervisorRoute'),
  packageRoutes: require('./packageRoute'),
  purchaseOrderRoutes: require('./purchaseOrderRoute'),
  importOrderRoutes: require('./importOrderRoute'),
  notificationRoutes: require('./notificationRoute'),
  contractRoutes: require('./contractRoute'),
  // warehouseRoutes: require('./warehouseRoute'),
  // presentativeRoutes: require('./presentativeRoute'),
  // retailerRoutes: require('./retailerRoute'),
  // supplierRoutes: require('./supplierRoute'),
  purchaseOrderRoutes: require('./purchaseOrderRoutes'),
};
