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

const seedDebtData = async () => {
  try {
    console.log('🌱 Seeding debt dashboard data...');

    // Create sample medicines
    const medicines = await Medicine.create([
      {
        medicine_name: 'Paracetamol 500mg',
        license_code: 'MED001',
        category: 'thuốc không kê đơn',
        unit_of_measure: 'viên',
        min_stock_threshold: 100,
        max_stock_threshold: 1000,
        status: 'active',
      },
      {
        medicine_name: 'Ibuprofen 400mg',
        license_code: 'MED002',
        category: 'thuốc không kê đơn',
        unit_of_measure: 'viên',
        min_stock_threshold: 80,
        max_stock_threshold: 800,
        status: 'active',
      },
      {
        medicine_name: 'Amoxicillin 500mg',
        license_code: 'MED003',
        category: 'Thuốc kháng sinh',
        unit_of_measure: 'viên',
        min_stock_threshold: 50,
        max_stock_threshold: 500,
        status: 'active',
      },
    ]);

    // Create sample users
    const users = await User.create([
      {
        email: 'supervisor@example.com',
        password: 'password123',
        role: 'supervisor',
        status: 'active',
      },
      {
        email: 'representative@example.com',
        password: 'password123',
        role: 'representative',
        status: 'active',
      },
      {
        email: 'warehouse_manager@example.com',
        password: 'password123',
        role: 'warehouse_manager',
        status: 'active',
      },
    ]);

    // Create sample contracts
    const contracts = await Contract.create([
      {
        contract_code: 'CT-2024-001',
        contract_type: 'economic',
        created_by: users[1]._id,
        partner_id: 'supplier1', // Mock partner ID
        partner_type: 'Supplier',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        items: [
          {
            medicine_id: medicines[0]._id,
            quantity: 1000,
            unit_price: 5000,
          },
          {
            medicine_id: medicines[1]._id,
            quantity: 800,
            unit_price: 6000,
          },
        ],
      },
      {
        contract_code: 'CT-2024-002',
        contract_type: 'economic',
        created_by: users[1]._id,
        partner_id: 'retailer1', // Mock partner ID
        partner_type: 'Retailer',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        items: [
          {
            medicine_id: medicines[0]._id,
            quantity: 500,
            unit_price: 8000,
          },
          {
            medicine_id: medicines[2]._id,
            quantity: 300,
            unit_price: 12000,
          },
        ],
      },
    ]);

    // Create sample import orders
    const importOrders = await ImportOrder.create([
      {
        contract_id: contracts[0]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        details: [
          {
            medicine_id: medicines[0]._id,
            quantity: 500,
            unit_price: 5000,
          },
          {
            medicine_id: medicines[1]._id,
            quantity: 400,
            unit_price: 6000,
          },
        ],
      },
      {
        contract_id: contracts[0]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        details: [
          {
            medicine_id: medicines[0]._id,
            quantity: 300,
            unit_price: 5200,
          },
        ],
      },
    ]);

    // Create sample export orders
    const exportOrders = await ExportOrder.create([
      {
        contract_id: contracts[1]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        details: [
          {
            medicine_id: medicines[0]._id,
            expected_quantity: 200,
            unit_price: 8000,
          },
          {
            medicine_id: medicines[2]._id,
            expected_quantity: 150,
            unit_price: 12000,
          },
        ],
      },
      {
        contract_id: contracts[1]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        details: [
          {
            medicine_id: medicines[0]._id,
            expected_quantity: 100,
            unit_price: 8500,
          },
        ],
      },
    ]);

    // Create sample bills
    const bills = await Bill.create([
      {
        import_order_id: importOrders[0]._id,
        type: 'IMPORT',
        status: 'pending',
        amountPaid: 0,
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 500,
            unit_price: 5000,
          },
          {
            medicine_lisence_code: 'MED002',
            quantity: 400,
            unit_price: 6000,
          },
        ],
      },
      {
        import_order_id: importOrders[1]._id,
        type: 'IMPORT',
        status: 'overdue',
        amountPaid: 0,
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 300,
            unit_price: 5200,
          },
        ],
      },
      {
        export_order_id: exportOrders[0]._id,
        type: 'EXPORT',
        status: 'pending',
        amountPaid: 0,
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 200,
            unit_price: 8000,
          },
          {
            medicine_lisence_code: 'MED003',
            quantity: 150,
            unit_price: 12000,
          },
        ],
      },
      {
        export_order_id: exportOrders[1]._id,
        type: 'EXPORT',
        status: 'completed',
        amountPaid: 850000,
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 100,
            unit_price: 8500,
          },
        ],
      },
      {
        type: 'PAYMENT_VOUCHER',
        voucher_code: 'PV-2024-001',
        payment_date: new Date('2024-01-15'),
        status: 'completed',
        amountPaid: 500000,
        details: [
          {
            medicine_lisence_code: 'PAYMENT',
            quantity: 1,
            unit_price: 500000,
          },
        ],
      },
    ]);

    console.log('✅ Debt dashboard data seeded successfully!');
    console.log(`📊 Created ${medicines.length} medicines`);
    console.log(`👥 Created ${users.length} users`);
    console.log(`📋 Created ${contracts.length} contracts`);
    console.log(`📦 Created ${importOrders.length} import orders`);
    console.log(`🚚 Created ${exportOrders.length} export orders`);
    console.log(`💰 Created ${bills.length} bills`);
  } catch (error) {
    console.error('❌ Error seeding debt data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedDebtData();
