const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const { Bill } = require('../models');
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

async function getBillTotalAmount(billId) {
  const bill = await Bill.findById(billId);
  const total = bill.details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);

  console.log('getBillTotalAmount debug:', {
    billId,
    billDetails: bill.details,
    calculatedTotal: total,
    unit: 'VND',
  });

  return total; // Trả về theo VND
}
// ==================
// 1. Thanh toán 1 hóa đơn 1 lần (Checkout Session)
async function createCheckoutSession({
  billId,
  amount,
  currency = 'vnd',
  successUrl,
  cancelUrl,
  paymentType, // 'import' | 'export'
}) {
  if (!billId || !amount) {
    throw new Error('Missing billId or amount');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Thanh toán công nợ (${paymentType === 'import' ? 'Nhập' : 'Xuất'}) - Phiếu ${billId}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl || `${frontendUrl}/success`,
    cancel_url: cancelUrl || `${frontendUrl}/not-found`,
    metadata: {
      billId,
      paymentType,
    },
  });

  return session.url;
}

async function createPaymentImport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({
    billId,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'import',
  });
}

async function createPaymentExport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({
    billId,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'export',
  });
}

// ==================
// 2. Thanh toán nhiều hóa đơn 1 lần (Checkout Session gom tổng)
async function createCheckoutSessionMulti({
  billIds,
  amount,
  currency = 'vnd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0 || !amount) {
    throw new Error('Missing billIds array or amount');
  }

  const billsStr = billIds.join(', ');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'vnd',
          product_data: {
            name: `Thanh toán công nợ (${paymentType === 'import' ? 'Nhập' : 'Xuất'}) - Các phiếu: ${billsStr}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl || `${frontendUrl}/success`,
    cancel_url: cancelUrl || `${frontendUrl}/not-found`,
    metadata: {
      billIds: billIds.join(','),
      paymentType,
    },
  });

  return session.url;
}

async function createPaymentImportMulti(billIds, amount, successUrl, cancelUrl) {
  return createCheckoutSessionMulti({
    billIds,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'import',
  });
}

async function createPaymentExportMulti(billIds, amount, successUrl, cancelUrl) {
  return createCheckoutSessionMulti({
    billIds,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'export',
  });
}

// Tạo hoặc cập nhật PaymentIntent (cho partial payment nhiều lần)
async function createOrUpdatePaymentIntentForBill({ billId, amount, currency = 'vnd' }) {
  const bill = await Bill.findById(billId);
  const totalAmount = await getBillTotalAmount(billId);
  const remainingAmount = totalAmount - bill.amountPaid;

  if (amount > remainingAmount) throw new Error('Amount exceeds remaining balance');

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: { billId },
    payment_method_types: ['card'],
  });
  // Thay vì log toàn bộ eventData
  console.log('Webhook event details:', {
    eventId: event.id,
    eventType: event.type,
    // Chỉ log những trường cần thiết
    metadata: event.data?.object?.metadata,
    amount: event.data?.object?.amount,
    amountReceived: event.data?.object?.amount_received,
    status: event.data?.object?.status,
  });
  return paymentIntent.client_secret;
}

// ==================
// WEBHOOK HANDLERS - Tách riêng từng function
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed event');

  try {
    const billIdsStr = session?.metadata?.billIds || '';
    const billIds = billIdsStr ? billIdsStr.split(',') : [];
    const singleBillId = session?.metadata?.billId;

    // Sửa: Xử lý amount đúng cách
    let amountPaid = 0;
    if (session.amount_total) {
      amountPaid = session.amount_total / 100; // Convert từ cents sang VND
    } else if (session.amount_subtotal) {
      amountPaid = session.amount_subtotal / 100;
    }

    console.log('Amount conversion debug:', {
      rawAmountTotal: session.amount_total,
      rawAmountSubtotal: session.amount_subtotal,
      convertedAmount: amountPaid,
      unit: 'VND',
    });

    console.log('Webhook metadata:', {
      billIds,
      singleBillId,
      amountPaid,
      rawAmountTotal: session.amount_total,
      rawAmountSubtotal: session.amount_subtotal,
    });

    if (billIds.length > 0) {
      await handleMultiBillPayment(billIds, amountPaid);
    } else if (singleBillId) {
      await handleSingleBillPayment(singleBillId, amountPaid);
    } else {
      console.error('No bill IDs found in webhook metadata');
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

async function handleMultiBillPayment(billIds, totalAmountPaid) {
  console.log(
    `Processing multi-bill payment for ${billIds.length} bills, total: ${totalAmountPaid}`,
  );

  let remainingAmount = totalAmountPaid;

  for (const billId of billIds) {
    try {
      const bill = await Bill.findById(billId);
      if (!bill) {
        console.error(`Bill ${billId} not found`);
        continue;
      }

      const totalAmount = await getBillTotalAmount(billId);
      const currentAmountPaid = bill.amountPaid || 0;
      const amountToApply = Math.min(remainingAmount, totalAmount - currentAmountPaid);

      if (amountToApply <= 0) {
        console.log(`Bill ${billId} already fully paid or no remaining amount`);
        continue;
      }

      const newAmountPaid = currentAmountPaid + amountToApply;
      const newStatus =
        newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

      await Bill.findByIdAndUpdate(billId, {
        amountPaid: newAmountPaid,
        status: newStatus,
      });

      console.log(`Bill ${billId} updated: amountPaid=${newAmountPaid}, status=${newStatus}`);
      remainingAmount -= amountToApply;

      if (remainingAmount <= 0) break;
    } catch (error) {
      console.error(`Error processing bill ${billId}:`, error);
    }
  }
}

async function handleSingleBillPayment(billId, amountPaid) {
  console.log(`Processing single bill payment for ${billId}, amount: ${amountPaid}`);

  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      console.error(`Bill ${billId} not found`);
      return;
    }

    const totalAmount = await getBillTotalAmount(billId); // VND
    const currentAmountPaid = bill.amountPaid || 0; // VND
    const newAmountPaid = currentAmountPaid + amountPaid; // VND

    // So sánh cùng đơn vị VND
    const newStatus =
      newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

    console.log('Status update debug:', {
      totalAmount, // VND
      currentAmountPaid, // VND
      amountPaid, // VND (đã convert từ cents)
      newAmountPaid, // VND
      newStatus,
      comparison: `${newAmountPaid} >= ${totalAmount} = ${newAmountPaid >= totalAmount}`,
    });
    await Bill.findByIdAndUpdate(billId, {
      amountPaid: newAmountPaid,
      status: newStatus,
    });

    console.log(`Bill ${billId} updated: amountPaid=${newAmountPaid}, status=${newStatus}`);
  } catch (error) {
    console.error(`Error processing single bill ${billId}:`, error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Processing payment_intent.succeeded event');

  try {
    const billId = paymentIntent.metadata?.billId;
    const amountPaid = (paymentIntent.amount_received || 0) / 100;
    if (!billId) {
      console.error('No billId found in payment intent metadata');
      return;
    }

    console.log(`Processing payment intent for bill ${billId}, amount: ${amountPaid}`);

    const bill = await Bill.findById(billId);
    if (!bill) {
      console.error(`Bill ${billId} not found`);
      return;
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;
    const newAmountPaid = currentAmountPaid + amountPaid;

    let newStatus = BILL_STATUSES.PENDING;
    if (newAmountPaid >= totalAmount) {
      newStatus = BILL_STATUSES.COMPLETED;
    } else if (newAmountPaid > 0) {
      newStatus = BILL_STATUSES.PARTIAL;
    }

    await Bill.findByIdAndUpdate(billId, {
      amountPaid: newAmountPaid,
      status: newStatus,
    });

    console.log(
      `Bill ${billId} updated via payment_intent.succeeded: amountPaid=${newAmountPaid}, status=${newStatus}`,
    );
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailure(session, eventType) {
  console.log(`Processing payment failure event: ${eventType}`);

  try {
    const billIdsStr = session?.metadata?.billIds || '';
    const billIds = billIdsStr ? billIdsStr.split(',') : [];
    const singleBillId = session?.metadata?.billId;

    if (billIds.length > 0) {
      // Xử lý nhiều hóa đơn
      for (const billId of billIds) {
        await updateBillStatus(billId, BILL_STATUSES.CANCELED);
        console.log(`Bill ${billId} CANCELED due to payment failure (multi)`);
      }
    } else if (singleBillId) {
      // Xử lý một hóa đơn
      await updateBillStatus(singleBillId, BILL_STATUSES.CANCELED);
      console.log(`Bill ${singleBillId} CANCELED due to payment failure (single)`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

// ==================
// MAIN WEBHOOK PROCESSOR
const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`Received webhook event: ${event.type}`);

    // Thêm logging chi tiết
    console.log('Webhook event details:', {
      eventId: event.id,
      eventType: event.type,
      eventData: event.data?.object,
      metadata: event.data?.object?.metadata,
      amountTotal: event.data?.object?.amount_total,
      amountSubtotal: event.data?.object?.amount_subtotal,
      amountReceived: event.data?.object?.amount_received,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);

    // Trong development, có thể bypass signature verification để test
    if (process.env.NODE_ENV === 'development' && !sig) {
      console.log('Development mode: Bypassing signature verification for testing');
      try {
        // Parse JSON body manually
        const body = req.body;
        if (typeof body === 'string') {
          event = JSON.parse(body);
        } else {
          event = body;
        }
        console.log('Development mode: Parsed webhook event manually');
      } catch (parseErr) {
        console.error('Failed to parse webhook body:', parseErr);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  try {
    const eventType = event.type;
    const eventData = event.data?.object;

    console.log(`Processing webhook event: ${eventType}`, {
      eventId: event.id,
      eventType,
      metadata: eventData?.metadata,
    });

    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(eventData);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(eventData);
        break;

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(eventData, eventType);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    console.log(`Webhook event ${eventType} processed successfully`);
    res.json({ received: true, eventType });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
      eventType: event?.type,
    });
  }
};

module.exports = {
  // 1 hóa đơn 1 lần
  createCheckoutSession,
  createPaymentImport,
  createPaymentExport,

  // Nhiều hóa đơn 1 lần
  createCheckoutSessionMulti,
  createPaymentImportMulti,
  createPaymentExportMulti,

  // 1 hóa đơn nhiều lần
  createOrUpdatePaymentIntentForBill,

  // Webhook xử lý
  processWebhookEvent,
};
