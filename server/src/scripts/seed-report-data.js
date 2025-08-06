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

const seedReportData = async () => {
  try {
    console.log('🌱 Seeding report data...');

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
      {
        medicine_name: 'Omeprazole 20mg',
        license_code: 'MED004',
        category: 'thuốc kê đơn',
        unit_of_measure: 'viên',
        min_stock_threshold: 60,
        max_stock_threshold: 600,
        status: 'active',
      },
      {
        medicine_name: 'Cetirizine 10mg',
        license_code: 'MED005',
        category: 'thuốc không kê đơn',
        unit_of_measure: 'viên',
        min_stock_threshold: 70,
        max_stock_threshold: 700,
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
        partner_id: 'supplier1',
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
        partner_id: 'retailer1',
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
      {
        contract_code: 'CT-2024-003',
        contract_type: 'economic',
        created_by: users[1]._id,
        partner_id: 'supplier2',
        partner_type: 'Supplier',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        items: [
          {
            medicine_id: medicines[3]._id,
            quantity: 600,
            unit_price: 15000,
          },
          {
            medicine_id: medicines[4]._id,
            quantity: 400,
            unit_price: 8000,
          },
        ],
      },
      {
        contract_code: 'CT-2024-004',
        contract_type: 'economic',
        created_by: users[1]._id,
        partner_id: 'retailer2',
        partner_type: 'Retailer',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        items: [
          {
            medicine_id: medicines[1]._id,
            quantity: 300,
            unit_price: 10000,
          },
          {
            medicine_id: medicines[4]._id,
            quantity: 200,
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
        order_code: 'IMP-2024-001',
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
        order_code: 'IMP-2024-002',
        details: [
          {
            medicine_id: medicines[0]._id,
            quantity: 300,
            unit_price: 5200,
          },
        ],
      },
      {
        contract_id: contracts[2]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        order_code: 'IMP-2024-003',
        details: [
          {
            medicine_id: medicines[3]._id,
            quantity: 300,
            unit_price: 15000,
          },
          {
            medicine_id: medicines[4]._id,
            quantity: 200,
            unit_price: 8000,
          },
        ],
      },
      {
        contract_id: contracts[2]._id,
        warehouse_manager_id: users[2]._id,
        status: 'pending',
        created_by: users[1]._id,
        order_code: 'IMP-2024-004',
        details: [
          {
            medicine_id: medicines[3]._id,
            quantity: 200,
            unit_price: 15500,
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
        order_code: 'EXP-2024-001',
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
        order_code: 'EXP-2024-002',
        details: [
          {
            medicine_id: medicines[0]._id,
            expected_quantity: 100,
            unit_price: 8500,
          },
        ],
      },
      {
        contract_id: contracts[3]._id,
        warehouse_manager_id: users[2]._id,
        status: 'completed',
        created_by: users[1]._id,
        approval_by: users[0]._id,
        order_code: 'EXP-2024-003',
        details: [
          {
            medicine_id: medicines[1]._id,
            expected_quantity: 150,
            unit_price: 10000,
          },
          {
            medicine_id: medicines[4]._id,
            expected_quantity: 100,
            unit_price: 12000,
          },
        ],
      },
      {
        contract_id: contracts[3]._id,
        warehouse_manager_id: users[2]._id,
        status: 'pending',
        created_by: users[1]._id,
        order_code: 'EXP-2024-004',
        details: [
          {
            medicine_id: medicines[1]._id,
            expected_quantity: 80,
            unit_price: 10500,
          },
        ],
      },
    ]);

    // Create sample bills with different statuses and dates
    const bills = await Bill.create([
      // Completed bills
      {
        import_order_id: importOrders[0]._id,
        type: 'IMPORT',
        status: 'completed',
        amountPaid: 4900000,
        bill_code: 'BILL-IMP-001',
        payment_date: new Date('2024-01-15'),
        due_date: new Date('2024-02-15'),
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
        export_order_id: exportOrders[0]._id,
        type: 'EXPORT',
        status: 'completed',
        amountPaid: 2800000,
        bill_code: 'BILL-EXP-001',
        payment_date: new Date('2024-01-20'),
        due_date: new Date('2024-02-20'),
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
        bill_code: 'BILL-EXP-002',
        payment_date: new Date('2024-02-01'),
        due_date: new Date('2024-03-01'),
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 100,
            unit_price: 8500,
          },
        ],
      },
      {
        import_order_id: importOrders[1]._id,
        type: 'IMPORT',
        status: 'completed',
        amountPaid: 1560000,
        bill_code: 'BILL-IMP-002',
        payment_date: new Date('2024-02-10'),
        due_date: new Date('2024-03-10'),
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 300,
            unit_price: 5200,
          },
        ],
      },
      {
        export_order_id: exportOrders[2]._id,
        type: 'EXPORT',
        status: 'completed',
        amountPaid: 2700000,
        bill_code: 'BILL-EXP-003',
        payment_date: new Date('2024-02-15'),
        due_date: new Date('2024-03-15'),
        details: [
          {
            medicine_lisence_code: 'MED002',
            quantity: 150,
            unit_price: 10000,
          },
          {
            medicine_lisence_code: 'MED005',
            quantity: 100,
            unit_price: 12000,
          },
        ],
      },
      {
        import_order_id: importOrders[2]._id,
        type: 'IMPORT',
        status: 'completed',
        amountPaid: 6100000,
        bill_code: 'BILL-IMP-003',
        payment_date: new Date('2024-02-20'),
        due_date: new Date('2024-03-20'),
        details: [
          {
            medicine_lisence_code: 'MED004',
            quantity: 300,
            unit_price: 15000,
          },
          {
            medicine_lisence_code: 'MED005',
            quantity: 200,
            unit_price: 8000,
          },
        ],
      },

      // Pending bills
      {
        import_order_id: importOrders[3]._id,
        type: 'IMPORT',
        status: 'pending',
        amountPaid: 0,
        bill_code: 'BILL-IMP-004',
        due_date: new Date('2024-04-15'),
        details: [
          {
            medicine_lisence_code: 'MED004',
            quantity: 200,
            unit_price: 15500,
          },
        ],
      },
      {
        export_order_id: exportOrders[3]._id,
        type: 'EXPORT',
        status: 'pending',
        amountPaid: 0,
        bill_code: 'BILL-EXP-004',
        due_date: new Date('2024-04-20'),
        details: [
          {
            medicine_lisence_code: 'MED002',
            quantity: 80,
            unit_price: 10500,
          },
        ],
      },

      // Overdue bills
      {
        type: 'PAYMENT_VOUCHER',
        status: 'overdue',
        amountPaid: 0,
        bill_code: 'BILL-PV-001',
        voucher_code: 'PV-2024-001',
        payment_date: new Date('2024-01-10'),
        due_date: new Date('2024-02-10'),
        details: [
          {
            medicine_lisence_code: 'PAYMENT',
            quantity: 1,
            unit_price: 500000,
          },
        ],
      },
      {
        type: 'PAYMENT_VOUCHER',
        status: 'overdue',
        amountPaid: 0,
        bill_code: 'BILL-PV-002',
        voucher_code: 'PV-2024-002',
        payment_date: new Date('2024-01-25'),
        due_date: new Date('2024-02-25'),
        details: [
          {
            medicine_lisence_code: 'PAYMENT',
            quantity: 1,
            unit_price: 750000,
          },
        ],
      },

      // More bills for different months
      {
        import_order_id: importOrders[0]._id,
        type: 'IMPORT',
        status: 'completed',
        amountPaid: 5200000,
        bill_code: 'BILL-IMP-005',
        payment_date: new Date('2024-03-05'),
        due_date: new Date('2024-04-05'),
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 600,
            unit_price: 5200,
          },
          {
            medicine_lisence_code: 'MED002',
            quantity: 500,
            unit_price: 6200,
          },
        ],
      },
      {
        export_order_id: exportOrders[0]._id,
        type: 'EXPORT',
        status: 'completed',
        amountPaid: 3200000,
        bill_code: 'BILL-EXP-005',
        payment_date: new Date('2024-03-10'),
        due_date: new Date('2024-04-10'),
        details: [
          {
            medicine_lisence_code: 'MED001',
            quantity: 250,
            unit_price: 8500,
          },
          {
            medicine_lisence_code: 'MED003',
            quantity: 180,
            unit_price: 12500,
          },
        ],
      },
      {
        import_order_id: importOrders[2]._id,
        type: 'IMPORT',
        status: 'completed',
        amountPaid: 6500000,
        bill_code: 'BILL-IMP-006',
        payment_date: new Date('2024-03-15'),
        due_date: new Date('2024-04-15'),
        details: [
          {
            medicine_lisence_code: 'MED004',
            quantity: 350,
            unit_price: 15500,
          },
          {
            medicine_lisence_code: 'MED005',
            quantity: 250,
            unit_price: 8500,
          },
        ],
      },
      {
        export_order_id: exportOrders[2]._id,
        type: 'EXPORT',
        status: 'completed',
        amountPaid: 2900000,
        bill_code: 'BILL-EXP-006',
        payment_date: new Date('2024-03-20'),
        due_date: new Date('2024-04-20'),
        details: [
          {
            medicine_lisence_code: 'MED002',
            quantity: 180,
            unit_price: 10500,
          },
          {
            medicine_lisence_code: 'MED005',
            quantity: 120,
            unit_price: 12500,
          },
        ],
      },
    ]);

    console.log('✅ Report data seeded successfully!');
    console.log(`📊 Created ${medicines.length} medicines`);
    console.log(`👥 Created ${users.length} users`);
    console.log(`📋 Created ${contracts.length} contracts`);
    console.log(`📦 Created ${importOrders.length} import orders`);
    console.log(`🚚 Created ${exportOrders.length} export orders`);
    console.log(`💰 Created ${bills.length} bills`);

    // Print summary statistics
    const totalBills = bills.length;
    const completedBills = bills.filter((bill) => bill.status === 'completed').length;
    const pendingBills = bills.filter((bill) => bill.status === 'pending').length;
    const overdueBills = bills.filter((bill) => bill.status === 'overdue').length;
    const importBills = bills.filter((bill) => bill.type === 'IMPORT').length;
    const exportBills = bills.filter((bill) => bill.type === 'EXPORT').length;
    const paymentBills = bills.filter((bill) => bill.type === 'PAYMENT_VOUCHER').length;

    console.log('\n📈 Summary Statistics:');
    console.log(`Total Bills: ${totalBills}`);
    console.log(`Completed: ${completedBills}`);
    console.log(`Pending: ${pendingBills}`);
    console.log(`Overdue: ${overdueBills}`);
    console.log(`Import Bills: ${importBills}`);
    console.log(`Export Bills: ${exportBills}`);
    console.log(`Payment Vouchers: ${paymentBills}`);
  } catch (error) {
    console.error('❌ Error seeding report data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedReportData();
