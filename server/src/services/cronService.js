const cron = require('node-cron');
const mongoose = require('mongoose');
const { User, Batch } = require('../models');

// Lấy batch hết hạn dưới 6 tháng kể từ refDate
const getBatchesExpiredUnder6Months = async (refDate) => {
  const endDate = new Date(refDate);
  endDate.setMonth(endDate.getMonth() + 6);

  const batches = await Batch.find({
    expiry_date: { $gte: refDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn khoảng 6-7, 7-8, 8-9 tháng
const getBatchesExpiringAtIntervals = async (refDate) => {
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

  const batches6 = await Batch.find({
    expiry_date: { $gte: start6, $lt: end6 },
  }).populate('medicine_id');

  const batches7 = await Batch.find({
    expiry_date: { $gte: start7, $lt: end7 },
  }).populate('medicine_id');

  const batches8 = await Batch.find({
    expiry_date: { $gte: start8, $lt: end8 },
  }).populate('medicine_id');

  return { batches6, batches7, batches8 };
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
};
