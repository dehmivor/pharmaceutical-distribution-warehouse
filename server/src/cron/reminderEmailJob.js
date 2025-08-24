const cron = require('node-cron');
const cronService = require('../services/cronService');
const {
  sendBillDueReminderEmail,
  sendStockReminderEmail,
  sendExpiryReminderEmail,
} = require('../services/emailService');
const User = require('../models/User');

/**
 * Cron job để gửi email nhắc hạn thông minh
 * Chạy mỗi 24 giờ để kiểm tra và gửi email khi cần thiết
 */
function startReminderEmailJob() {
  console.log('📧 Reminder Email Cron Job: Starting...');

  // Chạy mỗi 24 giờ vào 1:00 chiều để kiểm tra reminders
  cron.schedule(
    '0 13 * * *',
    async () => {
      try {
        console.log(
          '📧 Reminder Email Cron: Running daily check at 1:00 PM',
          new Date().toLocaleString('vi-VN'),
        );

        // Lấy danh sách supervisor để gửi email
        const supervisors = await User.find({
          role: 'supervisor',
          status: 'active',
        }).select('email full_name');

        if (supervisors.length === 0) {
          console.log('📧 No active supervisors found for reminder emails');
          return;
        }

        const supervisorEmails = supervisors.map((s) => s.email);
        console.log(
          `📧 Found ${supervisors.length} supervisors to send reminders to:`,
          supervisorEmails,
        );

        // Gửi tất cả reminders vào buổi sáng
        await processAllReminders(supervisorEmails);

        console.log('📧 Reminder Email Cron: Daily check completed successfully');
      } catch (error) {
        console.error('❌ Error in daily reminder check:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  console.log(
    '📧 Reminder Email Cron Job: Started successfully - Running once every 24 hours at 1:00 PM',
  );
}

/**
 * Xử lý reminders cho hóa đơn - chỉ gửi khi còn 3 ngày hoặc quá hạn
 */
async function processBillReminders(supervisorEmails) {
  try {
    const bills = await cronService.getBillsDueDate();

    // Chỉ gửi email cho bills cần thiết
    const billsToRemind = [
      ...bills.overdueBills, // Quá hạn - gửi ngay
      ...bills.urgentBills.filter((bill) => bill.daysUntilDue <= 3), // Còn 3 ngày trở xuống
    ];

    if (billsToRemind.length > 0) {
      console.log(`📧 Found ${billsToRemind.length} bills to send reminders for`);

      // Gửi email cho tất cả supervisor
      for (const email of supervisorEmails) {
        try {
          await sendBillDueReminderEmail(email, billsToRemind);
          console.log(`✅ Bill reminder email sent to supervisor: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to send bill reminder to ${email}:`, error.message);
        }
      }
    } else {
      console.log('📧 No bills need reminders at this time');
    }
  } catch (error) {
    console.error('❌ Error processing bill reminders:', error);
  }
}

/**
 * Xử lý reminders cho thuốc dưới mức tồn kho - gửi ngay lập tức
 */
async function processStockReminders(supervisorEmails) {
  try {
    const medicines = await cronService.getMedicinesByStockLevel();

    // Chỉ gửi email cho thuốc có mức độ nghiêm trọng
    const medicinesToRemind = [
      ...medicines.criticalStock, // Nghiêm trọng - gửi ngay
      ...medicines.warningStock, // Cảnh báo - gửi ngay
    ];

    if (medicinesToRemind.length > 0) {
      console.log(
        `📧 Found ${medicinesToRemind.length} medicines with low stock to send reminders for`,
      );

      // Gửi email cho tất cả supervisor
      for (const email of supervisorEmails) {
        try {
          await sendStockReminderEmail(email, medicinesToRemind);
          console.log(`✅ Stock reminder email sent to supervisor: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to send stock reminder to ${email}:`, error.message);
        }
      }
    } else {
      console.log('📧 No medicines with low stock need reminders');
    }
  } catch (error) {
    console.error('❌ Error processing stock reminders:', error);
  }
}

/**
 * Xử lý reminders cho thuốc hết hạn - gửi ngay lập tức
 */
async function processExpiryReminders(supervisorEmails) {
  try {
    const batches = await cronService.getBatchesExpiredUnder6Months(new Date());

    if (batches.length > 0) {
      console.log(`📧 Found ${batches.length} batches expiring soon to send reminders for`);

      // Gửi email cho tất cả supervisor
      for (const email of supervisorEmails) {
        try {
          await sendExpiryReminderEmail(email, batches);
          console.log(`✅ Expiry reminder email sent to supervisor: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to send expiry reminder to ${email}:`, error.message);
        }
      }
    } else {
      console.log('📧 No batches expiring soon need reminders');
    }
  } catch (error) {
    console.error('❌ Error processing expiry reminders:', error);
  }
}

/**
 * Xử lý tất cả reminders cùng lúc (cho daily check)
 */
async function processAllReminders(supervisorEmails) {
  try {
    console.log('📧 Processing all reminders for daily check...');

    // Chạy tất cả reminders
    await Promise.all([
      processBillReminders(supervisorEmails),
      processStockReminders(supervisorEmails),
      processExpiryReminders(supervisorEmails),
    ]);

    console.log('📧 All reminders processed for daily check');
  } catch (error) {
    console.error('❌ Error processing all reminders:', error);
  }
}

/**
 * Chạy reminders ngay lập tức (cho testing hoặc manual trigger)
 */
async function runRemindersNow() {
  try {
    console.log('📧 Running reminders immediately...');

    const supervisors = await User.find({
      role: 'supervisor',
      status: 'active',
    }).select('email full_name');

    if (supervisors.length === 0) {
      return { success: false, message: 'No active supervisors found' };
    }

    const supervisorEmails = supervisors.map((s) => s.email);

    await processAllReminders(supervisorEmails);

    return {
      success: true,
      message: `Reminders sent to ${supervisorEmails.length} supervisors`,
      supervisors: supervisorEmails,
    };
  } catch (error) {
    console.error('❌ Error running reminders immediately:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Dừng reminder email cron jobs
 */
function stopReminderEmailJob() {
  console.log('📧 Reminder Email Cron Job: Stopping...');
  // Cron jobs sẽ tự động dừng khi process kết thúc
  console.log('📧 Reminder Email Cron Job: Stopped');
}

module.exports = {
  startReminderEmailJob,
  runRemindersNow,
  stopReminderEmailJob,
  processBillReminders,
  processStockReminders,
  processExpiryReminders,
};
