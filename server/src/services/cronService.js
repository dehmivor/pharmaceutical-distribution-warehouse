const cron = require('node-cron');
const mongoose = require('mongoose');
const { User, Batch, Package, Supplier, Contract, Bill, Notification } = require('../models');
const { deleteNotification } = require('./notificationService');

// Lấy batch hết hạn dưới 6 tháng kể từ refDate
const getBatchesExpiredUnder6Months = async (refDate) => {
  console.log('getBatchesExpiredUnder6Months called with refDate:', refDate);
  const endDate = new Date(refDate);
  endDate.setMonth(endDate.getMonth() + 6);
  console.log('End date for under 6 months:', endDate);

  const batches = await Batch.find({
    expiry_date: { $gte: refDate, $lt: endDate },
  })
    .populate('medicine_id')
    .populate('supplier_id');

  console.log('Found batches under 6 months:', batches.length);

  // Get quantity information from packages
  const batchesWithQuantity = await Promise.all(
    batches.map(async (batch) => {
      const packages = await Package.find({ batch_id: batch._id });
      const totalQuantity = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

      return {
        ...batch.toObject(),
        quantity: totalQuantity,
        supplier: batch.supplier_id?.name || 'N/A',
      };
    }),
  );

  console.log('Batches with quantity processed:', batchesWithQuantity.length);
  return batchesWithQuantity;
};

// Lấy batch hết hạn khoảng 6-7, 7-8, 8-9 tháng
const getBatchesExpiringAtIntervals = async (refDate) => {
  console.log('getBatchesExpiringAtIntervals called with refDate:', refDate);
  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const start6 = addMonths(refDate, 6);
  const end6 = addMonths(refDate, 7);

  const start7 = addMonths(refDate, 7);
  const end7 = addMonths(refDate, 8);

  const start8 = addMonths(refDate, 8);
  const end8 = addMonths(refDate, 9);

  console.log('Date ranges:', { start6, end6, start7, end7, start8, end8 });

  const batches6 = await Batch.find({
    expiry_date: { $gte: start6, $lt: end6 },
  })
    .populate('medicine_id')
    .populate('supplier_id');

  const batches7 = await Batch.find({
    expiry_date: { $gte: start7, $lt: end7 },
  })
    .populate('medicine_id')
    .populate('supplier_id');

  const batches8 = await Batch.find({
    expiry_date: { $gte: start8, $lt: end8 },
  })
    .populate('medicine_id')
    .populate('supplier_id');

  console.log('Raw batches found:', {
    batches6: batches6.length,
    batches7: batches7.length,
    batches8: batches8.length,
  });

  // Get quantity information for all batches
  const getBatchesWithQuantity = async (batchList) => {
    return Promise.all(
      batchList.map(async (batch) => {
        const packages = await Package.find({ batch_id: batch._id });
        const totalQuantity = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

        return {
          ...batch.toObject(),
          quantity: totalQuantity,
          supplier: batch.supplier_id?.name || 'N/A',
        };
      }),
    );
  };

  const [batches6WithQuantity, batches7WithQuantity, batches8WithQuantity] = await Promise.all([
    getBatchesWithQuantity(batches6),
    getBatchesWithQuantity(batches7),
    getBatchesWithQuantity(batches8),
  ]);

  console.log('Batches with quantity processed:', {
    sixMonths: batches6WithQuantity.length,
    sevenMonths: batches7WithQuantity.length,
    eightMonths: batches8WithQuantity.length,
  });

  return {
    sixMonths: batches6WithQuantity,
    sevenMonths: batches7WithQuantity,
    eightMonths: batches8WithQuantity,
  };
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể
const getBatchesExpiringInRange = async (startDate, endDate) => {
  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong tháng cụ thể
const getBatchesExpiringInMonth = async (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong quý cụ thể
const getBatchesExpiringInQuarter = async (year, quarter) => {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong năm cụ thể
const getBatchesExpiringInYear = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng ngày cụ thể
const getBatchesExpiringInDateRange = async (startDate, endDate) => {
  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo giờ)
const getBatchesExpiringInHourRange = async (startHour, endHour) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(startHour, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(endHour, 0, 0, 0);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo phút)
const getBatchesExpiringInMinuteRange = async (startMinute, endMinute) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMinutes(startMinute, 0, 0);

  const endDate = new Date(now);
  endDate.setMinutes(endMinute, 0, 0);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo giây)
const getBatchesExpiringInSecondRange = async (startSecond, endSecond) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setSeconds(startSecond, 0);

  const endDate = new Date(now);
  endDate.setSeconds(endSecond, 0);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo millisecond)
const getBatchesExpiringInMillisecondRange = async (startMillisecond, endMillisecond) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMilliseconds(startMillisecond);

  const endDate = new Date(now);
  endDate.setMilliseconds(endMillisecond);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo ngày trong tuần)
const getBatchesExpiringInWeekdayRange = async (startWeekday, endWeekday) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - startDate.getDay() + startWeekday);

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - endDate.getDay() + endWeekday);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo ngày trong tháng)
const getBatchesExpiringInMonthdayRange = async (startMonthday, endMonthday) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startMonthday);

  const endDate = new Date(now);
  endDate.setDate(endMonthday);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn trong khoảng thời gian cụ thể (theo ngày trong năm)
const getBatchesExpiringInYeardayRange = async (startYearday, endYearday) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startYearday);

  const endDate = new Date(now);
  endDate.setDate(endYearday);

  const batches = await Batch.find({
    expiry_date: { $gte: startDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy danh sách thuốc có tồn kho thấp so với ngưỡng tối thiểu từ model Medicine
const getMedicinesBelowStockThreshold = async () => {
  try {
    console.log('Getting medicines below minimum stock threshold from Medicine model');

    // Lấy tất cả các batch còn hạn sử dụng
    const now = new Date();
    console.log('Current time:', now);

    const validBatches = await Batch.find({
      expiry_date: { $gt: now }, // Chỉ lấy batch chưa hết hạn
    })
      .populate('medicine_id')
      .populate('supplier_id');

    console.log('Valid batches found:', validBatches.length);
    console.log(
      'Sample batch:',
      validBatches[0]
        ? {
            batchId: validBatches[0]._id,
            medicineName: validBatches[0].medicine_id?.medicine_name,
            minStockThreshold: validBatches[0].medicine_id?.min_stock_threshold,
            expiryDate: validBatches[0].expiry_date,
          }
        : 'No batches',
    );

    // Tính tổng số lượng tồn kho cho từng loại thuốc
    const medicineStockMap = new Map();

    for (const batch of validBatches) {
      const medicineId = batch.medicine_id?._id?.toString();
      if (!medicineId) continue;

      // Lấy số lượng từ packages và thông tin vị trí
      const packages = await Package.find({ batch_id: batch._id }).populate('location_id');
      const batchQuantity = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

      if (medicineStockMap.has(medicineId)) {
        const existing = medicineStockMap.get(medicineId);
        existing.totalQuantity += batchQuantity;
        existing.batches.push({
          batchId: batch._id,
          batchCode: batch.batch_code,
          quantity: batchQuantity,
          expiryDate: batch.expiry_date,
          supplier: batch.supplier_id?.name || 'N/A',
          packages: packages.map((pkg) => ({
            packageId: pkg._id,
            quantity: pkg.quantity,
            location: pkg.location_id?.name || 'Unknown',
            area: pkg.location_id?.area_id?.name || 'Unknown',
          })),
        });
      } else {
        medicineStockMap.set(medicineId, {
          medicineId: batch.medicine_id._id,
          medicineName: batch.medicine_id.medicine_name,
          medicineCode: batch.medicine_id.license_code,
          category: batch.medicine_id.category,
          unit: batch.medicine_id.unit_of_measure,
          minimumStock: batch.medicine_id.min_stock_threshold || 0, // Lấy ngưỡng tối thiểu từ model Medicine
          totalQuantity: batchQuantity,
          batches: [
            {
              batchId: batch._id,
              batchCode: batch.batch_code,
              quantity: batchQuantity,
              expiryDate: batch.expiry_date,
              supplier: batch.supplier_id?.name || 'N/A',
              packages: packages.map((pkg) => ({
                packageId: pkg._id,
                quantity: pkg.quantity,
                location: pkg.location_id?.name || 'Unknown',
                area: pkg.location_id?.area_id?.name || 'Unknown',
              })),
            },
          ],
        });
      }
    }

    // Lọc ra những thuốc có tồn kho dưới ngưỡng tối thiểu
    console.log('Medicine stock map entries:', medicineStockMap.size);
    console.log('Sample medicine data:', Array.from(medicineStockMap.values())[0]);

    const medicinesBelowThreshold = Array.from(medicineStockMap.values())
      .filter((medicine) => {
        const isBelow = medicine.totalQuantity < medicine.minimumStock;
        console.log(
          `Medicine ${medicine.medicineName}: totalQuantity=${medicine.totalQuantity}, minimumStock=${medicine.minimumStock}, isBelow=${isBelow}`,
        );
        return isBelow;
      })
      .sort((a, b) => a.minimumStock - a.totalQuantity - (b.minimumStock - b.totalQuantity)); // Sắp xếp theo mức độ thiếu hụt

    console.log('Medicines below minimum stock threshold found:', medicinesBelowThreshold.length);
    return medicinesBelowThreshold;
  } catch (error) {
    console.error('Error in getMedicinesBelowStockThreshold:', error);
    throw error;
  }
};

// Lấy thông tin hợp đồng cho thuốc
const getMedicineContracts = async (medicineId) => {
  try {
    // Tìm tất cả hợp đồng có chứa thuốc này
    const contracts = await Contract.find({
      'medicines.medicine_id': medicineId,
      status: { $in: ['active', 'pending'] }, // Chỉ lấy hợp đồng active hoặc pending
    })
      .populate('supplier_id')
      .populate('retailer_id');

    return contracts.map((contract) => ({
      contractId: contract._id,
      contractCode: contract.contract_code,
      type: contract.contract_type, // import hoặc export
      status: contract.status,
      supplier: contract.supplier_id?.name || 'N/A',
      retailer: contract.retailer_id?.name || 'N/A',
      startDate: contract.start_date,
      endDate: contract.end_date,
      totalValue: contract.total_value,
    }));
  } catch (error) {
    console.error('Error getting medicine contracts:', error);
    return [];
  }
};

const getBillsDueDate = async () => {
  try {
    console.log('Getting bills due date alerts');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Lấy hóa đơn trong khoảng 90 ngày tới (quá hạn + sắp hạn)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90);

    // Lấy hóa đơn theo schema thực tế của Bill model
    const bills = await Bill.find({
      status: { $in: ['pending', 'partial'] }, // Chỉ lấy hóa đơn chưa thanh toán hoặc thanh toán một phần
    })
      .populate('import_order_id')
      .populate('export_order_id')
      .sort({ createdAt: 1 }); // Sắp xếp theo ngày tạo tăng dần

    // Phân loại hóa đơn theo mức độ ưu tiên
    const overdueBills = []; // Quá hạn
    const urgentBills = []; // Đến hạn trong 7 ngày
    const warningBills = []; // Đến hạn trong 30 ngày
    const upcomingBills = []; // Đến hạn trong 90 ngày

    bills.forEach((bill) => {
      // Tính toán ngày đến hạn dựa trên ngày tạo + 30 ngày (mặc định)
      const createdDate = new Date(bill.createdAt);
      const dueDate = new Date(createdDate);
      dueDate.setDate(createdDate.getDate() + 30); // Giả sử hóa đơn đến hạn sau 30 ngày

      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      // Tính số tiền còn nợ dựa trên details
      const totalAmount = bill.details?.reduce((sum, detail) => sum + (detail.amount || 0), 0) || 0;
      const remainingAmount = totalAmount - (bill.amountPaid || 0);

      if (daysUntilDue < 0) {
        // Quá hạn
        overdueBills.push({
          ...bill.toObject(),
          bill_code: bill.voucher_code || `BILL-${bill._id.toString().slice(-6)}`,
          bill_type: bill.type,
          due_date: dueDate,
          total_amount: totalAmount,
          paid_amount: bill.amountPaid || 0,
          daysOverdue: Math.abs(daysUntilDue),
          remainingAmount,
          priority: 'overdue',
        });
      } else if (daysUntilDue <= 7) {
        // Đến hạn trong 7 ngày
        urgentBills.push({
          ...bill.toObject(),
          bill_code: bill.voucher_code || `BILL-${bill._id.toString().slice(-6)}`,
          bill_type: bill.type,
          due_date: dueDate,
          total_amount: totalAmount,
          paid_amount: bill.amountPaid || 0,
          daysUntilDue,
          remainingAmount,
          priority: 'urgent',
        });
      } else if (daysUntilDue <= 30) {
        // Đến hạn trong 30 ngày
        warningBills.push({
          ...bill.toObject(),
          bill_code: bill.voucher_code || `BILL-${bill._id.toString().slice(-6)}`,
          bill_type: bill.type,
          due_date: dueDate,
          total_amount: totalAmount,
          paid_amount: bill.amountPaid || 0,
          daysUntilDue,
          remainingAmount,
          priority: 'warning',
        });
      } else {
        // Đến hạn trong 90 ngày
        upcomingBills.push({
          ...bill.toObject(),
          bill_code: bill.voucher_code || `BILL-${bill._id.toString().slice(-6)}`,
          bill_type: bill.type,
          due_date: dueDate,
          total_amount: totalAmount,
          paid_amount: bill.amountPaid || 0,
          daysUntilDue,
          remainingAmount,
          priority: 'upcoming',
        });
      }
    });

    // Sắp xếp theo mức độ ưu tiên
    overdueBills.sort((a, b) => b.daysOverdue - a.daysOverdue); // Quá hạn nhiều nhất lên đầu
    urgentBills.sort((a, b) => a.daysUntilDue - b.daysUntilDue); // Đến hạn sớm nhất lên đầu
    warningBills.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    upcomingBills.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    const result = {
      overdueBills,
      urgentBills,
      warningBills,
      upcomingBills,
      summary: {
        overdue: overdueBills.length,
        urgent: urgentBills.length,
        warning: warningBills.length,
        upcoming: upcomingBills.length,
        total: bills.length,
      },
    };

    console.log('Bills due date summary:', result.summary);
    return result;
  } catch (error) {
    console.error('Error in getBillsDueDate:', error);
    throw error;
  }
};

// Lấy danh sách thuốc có tồn kho thấp theo từng mức độ so với ngưỡng tối thiểu
const getMedicinesByStockLevel = async () => {
  try {
    console.log('Getting medicines by stock level compared to minimum threshold');

    const allMedicines = await getMedicinesBelowStockThreshold();

    // Phân loại theo mức độ thiếu hụt so với ngưỡng tối thiểu
    const criticalStock = allMedicines.filter((med) => {
      const shortage = med.minimumStock - med.totalQuantity;
      const shortagePercentage = (shortage / med.minimumStock) * 100;
      return shortagePercentage >= 50; // Thiếu hụt ≥50% ngưỡng tối thiểu
    });

    const warningStock = allMedicines.filter((med) => {
      const shortage = med.minimumStock - med.totalQuantity;
      const shortagePercentage = (shortage / med.minimumStock) * 100;
      return shortagePercentage >= 20 && shortagePercentage < 50; // Thiếu hụt 20-50%
    });

    const lowStock = allMedicines.filter((med) => {
      const shortage = med.minimumStock - med.totalQuantity;
      const shortagePercentage = (shortage / med.minimumStock) * 100;
      return shortagePercentage > 0 && shortagePercentage < 20; // Thiếu hụt 0-20%
    });

    // Lấy thông tin hợp đồng cho tất cả thuốc
    const medicinesWithContracts = await Promise.all(
      allMedicines.map(async (medicine) => {
        const contracts = await getMedicineContracts(medicine.medicineId);
        return {
          ...medicine,
          contracts,
        };
      }),
    );

    console.log('Medicines by stock level summary:', {
      critical: criticalStock.length,
      warning: warningStock.length,
      low: lowStock.length,
      total: allMedicines.length,
    });

    return {
      criticalStock: criticalStock.map((med) => ({
        ...med,
        contracts:
          medicinesWithContracts.find((m) => m.medicineId.toString() === med.medicineId.toString())
            ?.contracts || [],
      })),
      warningStock: warningStock.map((med) => ({
        ...med,
        contracts:
          medicinesWithContracts.find((m) => m.medicineId.toString() === med.medicineId.toString())
            ?.contracts || [],
      })),
      lowStock: lowStock.map((med) => ({
        ...med,
        contracts:
          medicinesWithContracts.find((m) => m.medicineId.toString() === med.medicineId.toString())
            ?.contracts || [],
      })),
      allMedicines: medicinesWithContracts,
    };
  } catch (error) {
    console.error('Error in getMedicinesByStockLevel:', error);
    throw error;
  }
};

async function deleteNotificationsOlderThanDays(days, io = null) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Lấy các notification cũ hơn cutoffDate
  const oldNotifications = await Notification.find({ created_at: { $lt: cutoffDate } });

  if (oldNotifications && io) {
    console.log('Emitting newNotification to system room');
    io.to('system_alert').emit('newNotification', oldNotifications);
    io.to('reminder').emit('newNotification', oldNotifications);
    io.to('export').emit('newNotification', oldNotifications);
    io.to('import').emit('newNotification', oldNotifications);
    io.to('inventory').emit('newNotification', oldNotifications);
  } else {
    console.log('Cannot emit: io =', io);
  }

  // Xóa từng notification và emit realtime nếu có io
  let deletedCount = 0;
  for (const noti of oldNotifications) {
    await deleteNotification(noti._id, io);
    deletedCount++;
  }
  return deletedCount;
}

async function notifySupervisorsAboutAlerts(io) {
  // 1. Lấy danh sách batch dưới mức tồn kho
  const medicinesBelowThreshold = await getMedicinesBelowStockThreshold();

  // Tạo notification cho mỗi loại batch thuốc thiếu kho
  if (medicinesBelowThreshold.length > 0) {
    const newNotification = await notificationService.createNotificationForAllSupervisors(
      {
        title: 'Thuốc tồn kho thấp',
        message: `Có ${medicinesBelowThreshold.length} loại thuốc có tồn kho dưới mức tối thiểu.`,
        type: 'reminder',
        priority: 'high',
        action_url: '/data&reports/data-tracking/alerts',
        metadata: {
          alertType: 'low_stock',
        },
      },
      io,
    );

    if (newNotification && io) {
      console.log('Emitting newNotification to system room');
      io.to('reminder').emit('newNotification', newNotification);
    } else {
      console.log('Cannot emit: io =', io);
    }
  }

  // 2. Lấy lô hết hạn gần
  const expiredBatches = await getBatchesExpiredUnder6Months(new Date());
  if (expiredBatches.length > 0) {
    const newNotification = await notificationService.createNotificationForAllSupervisors(
      {
        title: 'Lô thuốc sắp hết hạn',
        message: `Có ${expiredBatches.length} lô thuốc sắp hết hạn trong vòng 6 tháng.`,
        type: 'reminder',
        priority: 'high',
        action_url: '/data&reports/data-tracking/alerts',
        metadata: {
          alertType: 'batch_expiry',
        },
      },
      io,
    );

    if (newNotification && io) {
      console.log('Emitting newNotification to system room');
      io.to('system').emit('newNotification', newNotification);
    } else {
      console.log('Cannot emit: io =', io);
    }
  }

  // 3. Lấy hóa đơn đến hạn thanh toán
  const billsDue = await getBillsDueDate();
  const totalDueBills =
    billsDue.overdueBills.length + billsDue.urgentBills.length + billsDue.warningBills.length;
  if (totalDueBills > 0) {
    const newNotification = await notificationService.createNotificationForAllSupervisors(
      {
        title: 'Hóa đơn đến hạn thanh toán',
        message: `Có ${totalDueBills} hóa đơn sắp đến hạn hoặc quá hạn thanh toán.`,
        type: 'reminder',
        priority: 'high',
        action_url: '/data&reports/data-tracking/alerts',
        metadata: {
          alertType: 'bill_due',
        },
      },
      io,
    );

    if (newNotification && io) {
      console.log('Emitting newNotification to system room');
      io.to('system').emit('newNotification', newNotification);
    } else {
      console.log('Cannot emit: io =', io);
    }
  }
}

module.exports = {
  getBatchesExpiredUnder6Months,
  getBatchesExpiringAtIntervals,
  getBatchesExpiringInRange,
  getBatchesExpiringInMonth,
  getBatchesExpiringInQuarter,
  getBatchesExpiringInYear,
  getBatchesExpiringInDateRange,
  getBatchesExpiringInHourRange,
  getBatchesExpiringInMinuteRange,
  getBatchesExpiringInSecondRange,
  getBatchesExpiringInMillisecondRange,
  getBatchesExpiringInWeekdayRange,
  getBatchesExpiringInMonthdayRange,
  getBatchesExpiringInYeardayRange,
  getMedicinesBelowStockThreshold,
  getMedicinesByStockLevel,
  getBillsDueDate,
  deleteNotificationsOlderThanDays,
  notifySupervisorsAboutAlerts,
};
