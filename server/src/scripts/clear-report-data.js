const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const ImportOrder = require('../models/ImportOrder');
const ExportOrder = require('../models/ExportOrder');
const Contract = require('../models/Contract');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaceutical-warehouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const clearReportData = async () => {
  try {
    console.log('🧹 Clearing existing report data...');

    // Clear bills first (they reference orders)
    const billsDeleted = await Bill.deleteMany({});
    console.log(`🗑️ Deleted ${billsDeleted.deletedCount} bills`);

    // Clear import orders
    const importOrdersDeleted = await ImportOrder.deleteMany({});
    console.log(`🗑️ Deleted ${importOrdersDeleted.deletedCount} import orders`);

    // Clear export orders
    const exportOrdersDeleted = await ExportOrder.deleteMany({});
    console.log(`🗑️ Deleted ${exportOrdersDeleted.deletedCount} export orders`);

    // Clear contracts
    const contractsDeleted = await Contract.deleteMany({});
    console.log(`🗑️ Deleted ${contractsDeleted.deletedCount} contracts`);

    // Clear medicines (only test medicines)
    const medicinesDeleted = await Medicine.deleteMany({
      license_code: { $in: ['MED001', 'MED002', 'MED003', 'MED004', 'MED005'] },
    });
    console.log(`🗑️ Deleted ${medicinesDeleted.deletedCount} test medicines`);

    // Clear test users
    const usersDeleted = await User.deleteMany({
      email: {
        $in: [
          'supervisor@example.com',
          'representative@example.com',
          'warehouse_manager@example.com',
        ],
      },
    });
    console.log(`🗑️ Deleted ${usersDeleted.deletedCount} test users`);

    console.log('✅ Report data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing report data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the clearing function
clearReportData();
