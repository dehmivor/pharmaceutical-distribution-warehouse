/**
 * Currency conversion utilities for VND and USD
 * Ensures consistent handling across the application
 */

// Exchange rate constants (can be updated based on current rates)
const VND_TO_USD_RATE = 25000; // 1 USD = 25,000 VND
const USD_TO_VND_RATE = 25000; // 1 USD = 25,000 VND

/**
 * Convert VND amount to USD cents (for Stripe)
 * @param {number} amountVND - Amount in Vietnamese Dong
 * @returns {number} Amount in USD cents
 */
const convertVNDToUSDCents = (amountVND) => {
  if (!amountVND || amountVND <= 0) {
    throw new Error('Invalid VND amount');
  }

  // FIX: Đảm bảo precision cao hơn trong conversion
  const amountUSD = amountVND / VND_TO_USD_RATE;
  const amountCents = Math.round(amountUSD * 100);

  console.log('VND to USD Cents conversion:', {
    amountVND,
    amountUSD,
    amountCents,
    conversionRate: VND_TO_USD_RATE,
    unit: 'VND → USD Cents',
    precision: 'Rounded to nearest cent',
  });

  return amountCents;
};

/**
 * Convert USD cents to VND amount (from Stripe webhook)
 * @param {number} amountCents - Amount in USD cents
 * @returns {number} Amount in Vietnamese Dong
 */
const convertUSDCentsToVND = (amountCents) => {
  if (!amountCents || amountCents <= 0) {
    throw new Error('Invalid USD cents amount');
  }

  // FIX: Đảm bảo conversion chính xác từ cents về VND
  const amountUSD = amountCents / 100;
  const amountVND = Math.round(amountUSD * USD_TO_VND_RATE);

  console.log('USD Cents to VND conversion:', {
    amountCents,
    amountUSD,
    amountVND,
    conversionRate: USD_TO_VND_RATE,
    unit: 'USD Cents → VND',
    precision: 'Rounded to nearest VND',
    reverseCheck: `Reverse: ${amountVND} VND / ${USD_TO_VND_RATE} * 100 = ${Math.round((amountVND / USD_TO_VND_RATE) * 100)} cents`,
  });

  return amountVND;
};

/**
 * Validate minimum payment amount for Stripe (50 cents minimum)
 * @param {number} amountVND - Amount in VND
 * @returns {boolean} True if amount meets minimum requirement
 */
const validateMinimumPayment = (amountVND) => {
  const minimumVND = (50 * VND_TO_USD_RATE) / 100; // 50 cents in VND
  return amountVND >= minimumVND;
};

/**
 * Get minimum payment amount in VND
 * @returns {number} Minimum payment amount in VND
 */
const getMinimumPaymentAmount = () => {
  return (50 * VND_TO_USD_RATE) / 100;
};

/**
 * Format VND amount with proper formatting
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted amount string
 */
const formatVND = (amount) => {
  if (!amount && amount !== 0) return '0 VNĐ';
  return `${Math.round(amount).toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Parse formatted VND string back to number
 * @param {string} formattedAmount - Formatted amount string
 * @returns {number} Numeric amount
 */
const parseVND = (formattedAmount) => {
  if (!formattedAmount) return 0;
  return parseFloat(formattedAmount.toString().replace(/[,\sVNĐ]/g, ''));
};

module.exports = {
  VND_TO_USD_RATE,
  USD_TO_VND_RATE,
  convertVNDToUSDCents,
  convertUSDCentsToVND,
  validateMinimumPayment,
  getMinimumPaymentAmount,
  formatVND,
  parseVND,
};
