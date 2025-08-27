const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus, updateBillAmountPaid } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const { Bill } = require('../models');
const {
  convertVNDToUSDCents,
  convertUSDCentsToVND,
  validateMinimumPayment,
  getMinimumPaymentAmount,
} = require('../utils/currencyConverter');
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

async function getBillTotalAmount(billId) {
  const bill = await Bill.findById(billId);
  const total = bill.details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  return total; // VND
}

async function createCheckoutSession({
  billId,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  if (!billId || !amount) throw new Error('Missing billId or amount');

  if (!validateMinimumPayment(amount)) {
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );
  }

  const amountInCents = convertVNDToUSDCents(amount);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Thanh toán công nợ (${paymentType === 'import' ? 'Nhập' : 'Xuất'}) - Phiếu ${billId}`,
          },
          unit_amount: amountInCents,
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

// Tạo checkout session tổng cho nhiều hóa đơn
async function createCheckoutSessionMulti({
  billIds,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0)
    throw new Error('Missing or invalid billIds array');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than zero');

  const bills = await Bill.find({ _id: { $in: billIds } });
  if (bills.length !== billIds.length) throw new Error('Some bills not found');
  if (!validateMinimumPayment(amount))
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );

  const amountInCents = convertVNDToUSDCents(amount);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name:
              paymentType === 'import'
                ? `Thanh toán nhiều hóa đơn nhập - ${billIds.length} phiếu`
                : `Thanh toán nhiều hóa đơn xuất - ${billIds.length} phiếu`,
          },
          unit_amount: amountInCents,
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

async function createPaymentImport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({ billId, amount, successUrl, cancelUrl, paymentType: 'import' });
}

async function createPaymentExport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({ billId, amount, successUrl, cancelUrl, paymentType: 'export' });
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

// Thanh toán nhiều lần cho một hóa đơn (PaymentIntent), chỉnh sửa không cộng dồn mà cập nhật theo tiền thực Stripe trả
async function createOrUpdatePaymentIntentForBill({ billId, amount, currency = 'usd' }) {
  const bill = await Bill.findById(billId);
  if (!bill) throw new Error(`Bill ${billId} not found`);

  const totalAmount = await getBillTotalAmount(billId);
  const currentAmountPaid = bill.amountPaid || 0;

  if (currentAmountPaid >= totalAmount) throw new Error(`Bill ${billId} is already fully paid.`);

  const remainingAmount = Math.max(0, totalAmount - currentAmountPaid);
  if (remainingAmount <= 0) {
    throw new Error(`Bill ${billId} is already fully paid.`);
  }

  const amountToCharge = Math.min(amount, remainingAmount);
  if (!amountToCharge || amountToCharge <= 0) {
    throw new Error('Invalid amount to charge');
  }
  if (amount > remainingAmount)
    throw new Error(`Amount ${amount} exceeds remaining balance ${remainingAmount}`);
  if (!validateMinimumPayment(amount))
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );

  const amountInCents = convertVNDToUSDCents(amount);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata: { billId },
    payment_method_types: ['card'],
  });

  return paymentIntent.client_secret;
}
// Xử lý webhook thanh toán thành công - cập nhật chính xác số tiền đã thanh toán
async function handleSingleBillPayment(billId, amountPaidFromStripe) {
  console.log(`Processing single bill payment for ${billId}:`, {
    amountPaidFromStripe,
    amountPaidFromStripeType: typeof amountPaidFromStripe,
    unit: 'VND',
  });

  const bill = await Bill.findById(billId);
  if (!bill) throw new Error(`Bill ${billId} not found`);

  const totalAmount = await getBillTotalAmount(billId);
  const currentAmountPaid = bill.amountPaid || 0;

  console.log('Payment calculation details:', {
    billId,
    totalAmount,
    currentAmountPaid,
    amountPaidFromStripe,
    calculation: `Current: ${currentAmountPaid} + New: ${amountPaidFromStripe} = ${currentAmountPaid + amountPaidFromStripe}`,
    unit: 'VND',
  });

  let newAmountPaid;
  let paymentType;

  if (amountPaidFromStripe >= remainingAmount) {
    // Thanh toán hết phần còn lại
    newAmountPaid = totalAmount;
    paymentType = 'FULL_PAYMENT';
  } else {
    // Thanh toán một phần
    newAmountPaid = currentAmountPaid + amountPaidFromStripe;
    paymentType = 'PARTIAL_PAYMENT';
  }

  // Đảm bảo không vượt quá tổng tiền
  newAmountPaid = Math.min(newAmountPaid, totalAmount);

  const newStatus = newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

  console.log('Final payment calculation:', {
    billId,
    totalAmount,
    currentAmountPaid,
    amountPaidFromStripe,
    newAmountPaid,
    newStatus,
    paymentType,
    unit: 'VND',
  });

  await updateBillAmountPaid(billId, newAmountPaid, newStatus);

  console.log(`Bill ${billId} updated successfully:`, {
    oldAmountPaid: currentAmountPaid,
    newAmountPaid,
    oldStatus: bill.status,
    newStatus,
    paymentType,
    unit: 'VND',
  });
}

async function handleMultiBillPayment(billIds, totalAmountPaid) {
  console.log('=== MULTI-BILL PAYMENT ===');
  console.log('Multi-bill payment details:', {
    billIds,
    totalAmountPaid,
    totalAmountPaidType: typeof totalAmountPaid,
    unit: 'VND',
  });

  let remainingAmount = totalAmountPaid;
  let processedBills = 0;
  let failedBills = 0;

  for (const billId of billIds) {
    try {
      console.log(`Processing bill ${billId} (${processedBills + 1}/${billIds.length})`);

      const bill = await Bill.findById(billId);
      if (!bill) {
        console.error(`Bill ${billId} not found`);
        failedBills++;
        continue;
      }

      const totalAmount = await getBillTotalAmount(billId);
      const currentAmountPaid = bill.amountPaid || 0;

      console.log(`Bill ${billId} details:`, {
        totalAmount,
        currentAmountPaid,
        remainingAmount,
        unit: 'VND',
      });

      // FIX: Kiểm tra và cập nhật status nếu bill đã hoàn thành
      if (currentAmountPaid >= totalAmount) {
        console.log(`Bill ${billId} already fully paid, updating status to COMPLETED`);

        // Cập nhật status thành COMPLETED nếu chưa phải
        if (bill.status !== BILL_STATUSES.COMPLETED) {
          await updateBillAmountPaid(billId, currentAmountPaid, BILL_STATUSES.COMPLETED);
          console.log(`Bill ${billId} status updated to COMPLETED`);
        }
        continue;
      }

      const amountToApply = Math.min(remainingAmount, totalAmount - currentAmountPaid);

      console.log(`Bill ${billId} processing:`, {
        totalAmount,
        currentAmountPaid,
        amountToApply,
        remainingAmount,
        unit: 'VND',
      });

      if (amountToApply <= 0) {
        console.log(`Bill ${billId} no remaining amount to apply`);
        continue;
      }

      // FIX: Sử dụng amountToApply trực tiếp thay vì gọi function không tồn tại
      const validatedAmount = amountToApply;
      const newAmountPaid = currentAmountPaid + validatedAmount;
      const newStatus =
        newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

      console.log(`Bill ${billId} amountPaid update:`, {
        currentAmountPaid,
        amountToApply,
        validatedAmount,
        newAmountPaid,
        totalAmount,
        newStatus,
        unit: 'VND',
      });

      await updateBillAmountPaid(billId, newAmountPaid, newStatus);

      console.log(`Bill ${billId} updated: amountPaid=${newAmountPaid}, status=${newStatus}`);
      remainingAmount -= validatedAmount;
      processedBills++;

      if (remainingAmount <= 0) {
        console.log('All amount has been applied to bills');
        break;
      }
    } catch (error) {
      console.error(`Error processing bill ${billId}:`, error);
      failedBills++;
    }
  }

  console.log('Multi-bill payment summary:', {
    totalBills: billIds.length,
    processedBills,
    failedBills,
    remainingAmount,
    unit: 'VND',
  });
  console.log('=== MULTI-BILL PAYMENT - COMPLETED ===');
}

async function handleCheckoutSessionCompleted(session) {
  console.log('=== CHECKOUT SESSION COMPLETED ===');
  console.log('Session data:', {
    sessionId: session.id,
    amountTotal: session.amount_total,
    amountReceived: session.amount_received,
    amountSubtotal: session.amount_subtotal,
    currency: session.currency,
    metadata: session.metadata,
    unit: 'Stripe data',
  });

  let amountPaid = 0;

  // FIX: Ưu tiên amount_received (số tiền thực tế nhận được)
  if (session.amount_received !== undefined) {
    amountPaid = convertUSDCentsToVND(session.amount_received);
    console.log('Using amount_received:', {
      rawAmount: session.amount_received,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else if (session.amount_total !== undefined) {
    amountPaid = convertUSDCentsToVND(session.amount_total);
    console.log('Using amount_total:', {
      rawAmount: session.amount_total,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else {
    console.error('No amount data found in session:', session);
    throw new Error('No amount data found in checkout session');
  }

  console.log('Final amount calculation:', {
    amountPaid,
    amountPaidType: typeof amountPaid,
    unit: 'VND',
  });

  const billIdsStr = session?.metadata?.billIds || '';
  const billIds = billIdsStr ? billIdsStr.split(',') : [];
  const singleBillId = session?.metadata?.billId;

  console.log('Bill processing decision:', {
    billIds,
    singleBillId,
    isMultiPayment: billIds.length > 0,
    isSinglePayment: !!singleBillId,
    amountPaid,
    unit: 'VND',
  });

  if (billIds.length > 0) {
    console.log(`Processing multi-bill payment for ${billIds.length} bills`);
    await handleMultiBillPayment(billIds, amountPaid);
  } else if (singleBillId) {
    console.log(`Processing single bill payment for ${singleBillId}`);
    await handleSingleBillPayment(singleBillId, amountPaid);
  } else {
    console.error('No bill IDs found in webhook metadata');
    throw new Error('No bill IDs found in webhook metadata');
  }

  console.log('=== CHECKOUT SESSION COMPLETED - PROCESSED ===');
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('=== PAYMENT INTENT SUCCEEDED ===');
  console.log('PaymentIntent data:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amount_received,
    amountCapturable: paymentIntent.amount_capturable,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
    unit: 'Stripe data',
  });

  const billId = paymentIntent.metadata?.billId;
  if (!billId) {
    console.error('No billId found in payment intent metadata');
    return;
  }

  // FIX: Ưu tiên amount_received (số tiền thực tế nhận được)
  let amountPaid = 0;
  if (paymentIntent.amount_received !== undefined) {
    amountPaid = convertUSDCentsToVND(paymentIntent.amount_received);
    console.log('Using amount_received:', {
      rawAmount: paymentIntent.amount_received,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else if (paymentIntent.amount !== undefined) {
    amountPaid = convertUSDCentsToVND(paymentIntent.amount);
    console.log('Using amount:', {
      rawAmount: paymentIntent.amount,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else {
    console.error('No amount data found in payment intent');
    throw new Error('No amount data found in payment intent');
  }

  console.log('Final amount calculation:', {
    billId,
    amountPaid,
    amountPaidType: typeof amountPaid,
    unit: 'VND',
  });

  await handleSingleBillPayment(billId, amountPaid);

  console.log(`Payment intent ${paymentIntent.id} processed successfully`);
  console.log('=== PAYMENT INTENT SUCCEEDED - PROCESSED ===');
}

async function handlePaymentFailure(session, eventType) {
  const billIdsStr = session?.metadata?.billIds || '';
  const billIds = billIdsStr ? billIdsStr.split(',') : [];
  const singleBillId = session?.metadata?.billId;

  if (billIds.length > 0) {
    for (const billId of billIds) {
      await updateBillStatus(billId, BILL_STATUSES.CANCELLED);
      console.log(`Bill ${billId} CANCELED due to payment failure (multi)`);
    }
  } else if (singleBillId) {
    await updateBillStatus(singleBillId, BILL_STATUSES.CANCELLED);
    console.log(`Bill ${singleBillId} CANCELED due to payment failure (single)`);
  }
}

const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`Received webhook event: ${event.type}`);
  } catch (signatureErr) {
    console.error('Webhook signature verification failed:', signatureErr.message);
    return res
      .status(400)
      .json({ error: 'Webhook signature verification failed', details: signatureErr.message });
  }

  const eventType = event.type;
  const eventData = event.data?.object;

  console.log(`Processing webhook event: ${eventType}`, {
    eventId: event.id,
    metadata: eventData?.metadata,
  });

  try {
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
    return res.json({ received: true, eventType, eventId: event.id });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentImport,
  createPaymentExport,
  createCheckoutSessionMulti,
  createPaymentImportMulti,
  createPaymentExportMulti,
  createOrUpdatePaymentIntentForBill,
  processWebhookEvent,
};
