const mongoose = require('mongoose');
const { Bill } = require('../models');
require('dotenv').config();

async function fixAmountPaidUnits() {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/PDW');
    console.log('Connected to MongoDB');

    // Lấy tất cả bills có amountPaid > 0
    const bills = await Bill.find({ amountPaid: { $gt: 0 } });
    console.log(`Found ${bills.length} bills with amountPaid > 0`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const bill of bills) {
      const originalAmountPaid = bill.amountPaid;

      // Nếu amountPaid > 1000, có thể là cents, convert về VND
      if (originalAmountPaid > 1000) {
        const newAmountPaid = originalAmountPaid / 100;

        console.log(`Bill ${bill._id}: ${originalAmountPaid} → ${newAmountPaid} VNĐ`);

        await Bill.findByIdAndUpdate(bill._id, {
          amountPaid: newAmountPaid,
        });

        fixedCount++;
      } else {
        console.log(`Bill ${bill._id}: ${originalAmountPaid} VNĐ (already correct)`);
        skippedCount++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total bills processed: ${bills.length}`);
    console.log(`Fixed (converted from cents): ${fixedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
  } catch (error) {
    console.error('Error fixing amount paid units:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Chạy script
fixAmountPaidUnits();
