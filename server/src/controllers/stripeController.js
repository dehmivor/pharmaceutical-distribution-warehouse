const { Bill } = require('../models');
const stripeService = require('../services/stripeService');

async function getBillsTotalAmount(billIds) {
  const bills = await Bill.find({ _id: { $in: billIds } });
  let sumAll = 0;
  bills.forEach((bill) => {
    let totalBill = 0;
    if (bill.details && bill.details.length) {
      totalBill = bill.details.reduce((total, item) => total + item.quantity * item.unit_price, 0);
    }
    sumAll += totalBill;
  });
  return sumAll;
}

const createPaymentIntentController = async (req, res) => {
  const { billId, amount, currency = 'vnd' } = req.body; // nhận billId đơn, amount cần thanh toán partial
  if (!billId || !amount) {
    return res.status(400).json({ error: 'Missing billId or amount' });
  }
  try {
    const clientSecret = await stripeService.createOrUpdatePaymentIntentForBill({
      billId,
      amount,
      currency,
    });
    res.json({ clientSecret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMultiPayment = async (req, res) => {
  const { billIds, successUrl, cancelUrl, paymentType } = req.body;
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid billIds' });
  }
  try {
    const bills = await Bill.find({
      _id: { $in: billIds },
      status: { $in: ['PENDING', 'PARTIAL'] },
    });
    if (bills.length !== billIds.length) {
      return res.status(400).json({ error: 'Some bills are invalid or not payable' });
    }
    const amount = await getBillsTotalAmount(billIds);
    console.log(amount);
    if (amount <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than zero' });
    }
    let url;
    if (paymentType === 'import') {
      url = await stripeService.createPaymentImportMulti(billIds, amount, successUrl, cancelUrl);
    } else if (paymentType === 'export') {
      url = await stripeService.createPaymentExportMulti(billIds, amount, successUrl, cancelUrl);
    } else {
      return res.status(400).json({ error: 'Invalid paymentType' });
    }
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller thanh toán 1 hóa đơn 1 lần (checkout session)
const createPaymentSingle = async (req, res) => {
  const { paymentId } = req.params;
  const { amount, successUrl, cancelUrl, paymentType } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId in URL params' });
  }
  if (!amount) {
    return res.status(400).json({ error: 'Missing amount in request body' });
  }
  if (!paymentType || (paymentType !== 'import' && paymentType !== 'export')) {
    return res.status(400).json({ error: 'Invalid or missing paymentType' });
  }

  try {
    let url;
    if (paymentType === 'import') {
      url = await stripeService.createPaymentImport(paymentId, amount, successUrl, cancelUrl);
    } else {
      url = await stripeService.createPaymentExport(paymentId, amount, successUrl, cancelUrl);
    }
    res.json({ url });
  } catch (err) {
    console.error('Error in createPaymentSingle:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    await stripeService.processWebhookEvent(req, res);
  } catch (error) {
    console.error('Webhook xử lý lỗi:', error);
    res.status(500).send(`Webhook handler failed: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntentController, // 1 hóa đơn nhiều lần (partial)
  createMultiPayment, // nhiều hóa đơn 1 lần (gom tổng)
  createPaymentSingle, // 1 hóa đơn 1 lần thông thường
  handleWebhook,
};
