const { Bill } = require('../models');
const stripeService = require('../services/stripeService');

async function getBillsTotalAmount(billIds) {
  try {
    console.log('getBillsTotalAmount debug:', { billIds });

    const bills = await Bill.find({ _id: { $in: billIds } });
    console.log('Bills found:', bills.length);

    let sumAll = 0;
    bills.forEach((bill, index) => {
      let totalBill = 0;
      if (bill.details && bill.details.length) {
        totalBill = bill.details.reduce(
          (total, item) => total + item.quantity * item.unit_price,
          0,
        );
      }
      sumAll += totalBill;

      console.log(`Bill ${index + 1}:`, {
        billId: bill._id,
        detailsCount: bill.details?.length || 0,
        totalBill,
        sumAll,
      });
    });

    console.log('Total amount calculated:', sumAll);
    return sumAll;
  } catch (error) {
    console.error('Error in getBillsTotalAmount:', error);
    throw new Error(`Failed to calculate total amount: ${error.message}`);
  }
}

const createPaymentIntentController = async (req, res) => {
  const { billId, amount, currency = 'vnd' } = req.body;

  if (!billId || !amount) {
    return res.status(400).json({ error: 'Missing billId or amount' });
  }

  try {
    console.log(`Creating payment intent for bill ${billId}, amount: ${amount}`);

    // FIX: Kiểm tra và sửa data sai trước khi tạo PaymentIntent
    const stripeService = require('../services/stripeService');
    const wasFixed = await stripeService.fixBillAmountPaid(billId);

    if (wasFixed) {
      console.log(`Bill ${billId} data was fixed, proceeding with PaymentIntent creation`);
    }

    const clientSecret = await stripeService.createOrUpdatePaymentIntentForBill({
      billId,
      amount,
      currency,
    });

    console.log(`Payment intent created successfully for bill ${billId}`);
    res.json({ clientSecret });
  } catch (err) {
    console.error(`Error creating payment intent for bill ${billId}:`, err);
    res.status(500).json({ error: err.message });
  }
};

const createMultiPayment = async (req, res) => {
  try {
    const { billIds, successUrl, cancelUrl, paymentType } = req.body;

    console.log('createMultiPayment request:', {
      billIds,
      successUrl,
      cancelUrl,
      paymentType,
      bodyKeys: Object.keys(req.body),
    });

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      console.error('Invalid billIds:', billIds);
      return res.status(400).json({ error: 'Missing or invalid billIds' });
    }

    if (!paymentType || (paymentType !== 'import' && paymentType !== 'export')) {
      console.error('Invalid paymentType:', paymentType);
      return res.status(400).json({ error: 'Invalid paymentType' });
    }

    console.log(`Creating multi-payment for ${billIds.length} bills, type: ${paymentType}`);

    const bills = await Bill.find({
      _id: { $in: billIds },
      status: { $in: ['pending', 'partial'] },
    });

    console.log('Bills validation:', {
      requested: billIds.length,
      found: bills.length,
      billIds: billIds,
      foundBills: bills.map((b) => ({ id: b._id, status: b.status })),
    });

    if (bills.length !== billIds.length) {
      const foundIds = bills.map((b) => b._id.toString());
      const missingIds = billIds.filter((id) => !foundIds.includes(id));
      console.error('Some bills not found or not payable:', { missingIds, foundIds });
      return res.status(400).json({
        error: 'Some bills are invalid or not payable',
        missingIds,
        foundIds,
      });
    }

    const amount = await getBillsTotalAmount(billIds);
    console.log(`Total amount for multi-payment: ${amount}`);

    if (amount <= 0) {
      console.error('Total amount is zero or negative:', amount);
      return res.status(400).json({ error: 'Total amount must be greater than zero' });
    }

    let url;
    if (paymentType === 'import') {
      url = await stripeService.createPaymentImportMulti(billIds, amount, successUrl, cancelUrl);
    } else if (paymentType === 'export') {
      url = await stripeService.createPaymentExportMulti(billIds, amount, successUrl, cancelUrl);
    }

    console.log(`Multi-payment created successfully, redirecting to: ${url}`);
    res.json({ url });
  } catch (err) {
    console.error('Error creating multi-payment:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'Có lỗi khi kết nối thanh toán nhiều hóa đơn. Vui lòng thử lại sau.',
      details: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};

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
    console.log(
      `Creating single payment for bill ${paymentId}, amount: ${amount}, type: ${paymentType}`,
    );

    let url;
    if (paymentType === 'import') {
      url = await stripeService.createPaymentImport(paymentId, amount, successUrl, cancelUrl);
    } else {
      url = await stripeService.createPaymentExport(paymentId, amount, successUrl, cancelUrl);
    }

    console.log(`Single payment created successfully, redirecting to: ${url}`);
    res.json({ url });
  } catch (err) {
    console.error(`Error creating single payment for bill ${paymentId}:`, err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Webhook received, processing...');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request body type:', typeof req.body);
    console.log('Request body length:', req.body ? JSON.stringify(req.body).length : 0);

    // Log webhook headers for debugging
    console.log('Webhook headers:', {
      'stripe-signature': req.headers['stripe-signature'] ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      host: req.headers['host'],
      origin: req.headers['origin'],
    });

    await stripeService.processWebhookEvent(req, res);
  } catch (error) {
    console.error('Webhook handler failed:', error);

    // Send detailed error response for debugging
    res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = {
  createPaymentIntentController,
  createMultiPayment,
  createPaymentSingle,
  handleWebhook,
};
