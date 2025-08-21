const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus, updateBillAmountPaid } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const { Bill } = require('../models');
const {
  // Chỉnh sửa 2 hàm convert tiền tệ với tỉ giá chính xác và làm tròn hợp lý
  convertVNDToUSDCents,
  convertUSDCentsToVND,
  validateMinimumPayment,
  getMinimumPaymentAmount,
} = require('../utils/currencyConverter');
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

// Tạo checkout session cho 1 hóa đơn
async function createCheckoutSession({
  billId,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType, // 'import' | 'export'
}) {
  if (!billId || !amount) {
    throw new Error('Missing billId or amount');
  }

  if (!validateMinimumPayment(amount)) {
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );
  }

  const amountInCents = convertVNDToUSDCents(amount);

  console.log('createCheckoutSession debug:', {
    billId,
    amountVND: amount,
    amountCents: amountInCents,
    currency,
    paymentType,
  });

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

// Tạo checkout session tổng cho nhiều hóa đơn
async function createCheckoutSessionMulti({
  billIds,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  try {
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      throw new Error('Missing or invalid billIds array');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const bills = await Bill.find({ _id: { $in: billIds } });
    if (bills.length !== billIds.length) {
      throw new Error('Some bills not found');
    }

    if (!validateMinimumPayment(amount)) {
      throw new Error(
        `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
      );
    }

    const amountInCents = convertVNDToUSDCents(amount);

    console.log('createCheckoutSessionMulti debug:', {
      billIds,
      billIdsStr: billIds.join(','),
      amountVND: amount,
      amountCents: amountInCents,
      currency,
      paymentType,
      billsFound: bills.length,
    });

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

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
    });

    return session.url;
  } catch (error) {
    console.error('Error creating checkout session multi:', error);
    throw error;
  }
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

// Thanh toán nhiều lần cho một hóa đơn (PaymentIntent)
async function createOrUpdatePaymentIntentForBill({ billId, amount, currency = 'usd' }) {
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;

    if (currentAmountPaid >= totalAmount) {
      throw new Error(
        `Bill ${billId} is already fully paid. Total: ${totalAmount}, Paid: ${currentAmountPaid}`,
      );
    }

    const remainingAmount = totalAmount - currentAmountPaid;

    console.log('createOrUpdatePaymentIntentForBill debug:', {
      billId,
      amount,
      totalAmount,
      currentAmountPaid,
      remainingAmount,
      currency,
      isFullyPaid: currentAmountPaid >= totalAmount,
    });

    if (remainingAmount > 0 && amount > remainingAmount) {
      throw new Error(`Amount ${amount} exceeds remaining balance ${remainingAmount}`);
    }

    if (!validateMinimumPayment(amount)) {
      throw new Error(
        `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
      );
    }

    const amountInCents = convertVNDToUSDCents(amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: { billId },
      payment_method_types: ['card'],
    });

    console.log('PaymentIntent created successfully:', {
      billId,
      amountVND: amount,
      amountCents: amountInCents,
      paymentIntentId: paymentIntent.id,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    throw error;
  }
}

async function fixBillAmountPaid(billId) {
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      console.error(`Bill ${billId} not found`);
      return;
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;

    console.log(`Fixing bill ${billId}:`, {
      totalAmount,
      currentAmountPaid,
      difference: totalAmount - currentAmountPaid,
      unit: 'VND',
    });

    if (currentAmountPaid > totalAmount) {
      await updateBillAmountPaid(billId, 0, BILL_STATUSES.PENDING);
      console.log(`Bill ${billId} amountPaid reset to 0 (was ${currentAmountPaid})`);
      return true;
    }

    if (currentAmountPaid === totalAmount && bill.status !== BILL_STATUSES.COMPLETED) {
      await updateBillAmountPaid(billId, currentAmountPaid, BILL_STATUSES.COMPLETED);
      console.log(`Bill ${billId} status updated to COMPLETED`);
      return true;
    }

    if (
      currentAmountPaid > 0 &&
      currentAmountPaid < totalAmount &&
      bill.status !== BILL_STATUSES.PARTIAL
    ) {
      await updateBillAmountPaid(billId, currentAmountPaid, BILL_STATUSES.PARTIAL);
      console.log(`Bill ${billId} status updated to PARTIAL`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing bill ${billId}:`, error);
    return false;
  }
}

// Validate số tiền thanh toán giữa intended và actual, tránh sai số do làm tròn
async function validatePaymentAmount(billId, intendedAmount, actualAmount) {
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;
    const remainingAmount = totalAmount - currentAmountPaid;

    console.log('Payment amount validation:', {
      billId,
      intendedAmount,
      actualAmount,
      totalAmount,
      currentAmountPaid,
      remainingAmount,
      unit: 'VND',
    });

    if (intendedAmount <= 0) {
      throw new Error(`Invalid intended amount: ${intendedAmount}`);
    }

    if (intendedAmount > remainingAmount) {
      throw new Error(
        `Intended amount ${intendedAmount} exceeds remaining amount ${remainingAmount}`,
      );
    }

    const tolerance = 1; // Sai số cho phép 1 VND
    const difference = Math.abs(actualAmount - intendedAmount);

    if (difference > tolerance) {
      console.warn(
        `Payment amount mismatch: intended=${intendedAmount}, actual=${actualAmount}, difference=${difference}`,
      );
      // Sử dụng số tiền thực tế nhận được nếu sai lệch lớn
      return actualAmount;
    }

    return intendedAmount;
  } catch (error) {
    console.error(`Error validating payment amount for bill ${billId}:`, error);
    throw error;
  }
}

// Xử lý webhook khi hoàn tất thanh toán session
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed event');

  try {
    const billIdsStr = session?.metadata?.billIds || '';
    const billIds = billIdsStr ? billIdsStr.split(',') : [];
    const singleBillId = session?.metadata?.billId;

    let amountPaid = 0;
    if (session.amount_total) {
      amountPaid = convertUSDCentsToVND(session.amount_total);
    } else if (session.amount_subtotal) {
      amountPaid = convertUSDCentsToVND(session.amount_subtotal);
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
  let processedBills = 0;
  let failedBills = 0;

  for (const billId of billIds) {
    try {
      const bill = await Bill.findById(billId);
      if (!bill) {
        console.error(`Bill ${billId} not found`);
        failedBills++;
        continue;
      }

      const totalAmount = await getBillTotalAmount(billId);
      const currentAmountPaid = bill.amountPaid || 0;

      if (currentAmountPaid >= totalAmount) {
        console.log(`Bill ${billId} already fully paid, updating status to COMPLETED`);

        if (bill.status !== BILL_STATUSES.COMPLETED) {
          await Bill.findByIdAndUpdate(billId, {
            status: BILL_STATUSES.COMPLETED,
          });
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
      });

      if (amountToApply <= 0) {
        console.log(`Bill ${billId} no remaining amount to apply`);
        continue;
      }

      const validatedAmount = await validatePaymentAmount(billId, amountToApply, amountToApply);
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
  });
}

async function handleSingleBillPayment(billId, amountPaid) {
  console.log(
    `Processing single bill payment for ${billId}, amount: ${amountPaid}, type: ${typeof amountPaid}`,
  );

  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      console.error(`Bill ${billId} not found`);
      return;
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;

    const validatedAmount = await validatePaymentAmount(billId, amountPaid, amountPaid);
    const newAmountPaid = currentAmountPaid + validatedAmount;

    console.log('Detailed payment calculation:', {
      billId,
      totalAmount,
      currentAmountPaid,
      originalAmountPaid: amountPaid,
      validatedAmount,
      newAmountPaid,
      calculation: `${currentAmountPaid} + ${validatedAmount} = ${newAmountPaid}`,
      allValuesType: {
        totalAmount: typeof totalAmount,
        currentAmountPaid: typeof currentAmountPaid,
        amountPaid: typeof amountPaid,
        validatedAmount: typeof validatedAmount,
        newAmountPaid: typeof newAmountPaid,
      },
      unit: 'VND',
    });

    const newStatus =
      newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

    console.log('Status update debug:', {
      totalAmount,
      currentAmountPaid,
      amountPaid,
      validatedAmount,
      newAmountPaid,
      newStatus,
      comparison: `${newAmountPaid} >= ${totalAmount} = ${newAmountPaid >= totalAmount}`,
      unit: 'VND',
    });

    await updateBillAmountPaid(billId, newAmountPaid, newStatus);

    console.log(`Bill ${billId} updated: amountPaid=${newAmountPaid}, status=${newStatus}`);
  } catch (error) {
    console.error(`Error processing single bill ${billId}:`, error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const billId = paymentIntent.metadata?.billId;

    const amountPaid = convertUSDCentsToVND(paymentIntent.amount || 0);

    console.log('PaymentIntent succeeded debug:', {
      billId,
      amount: paymentIntent.amount,
      amount_received: paymentIntent.amount_received,
      amount_capturable: paymentIntent.amount_capturable,
      amountPaid,
      amountPaidUnit: 'VND',
      metadata: paymentIntent.metadata,
    });

    if (!billId) {
      console.error('No billId found in payment intent metadata');
      return;
    }

    await handleSingleBillPayment(billId, amountPaid);
    console.log(`Payment intent ${paymentIntent.id} processed successfully`);
  } catch (error) {
    console.error(`Error processing payment intent ${paymentIntent.id}:`, error);
  }
}

async function handlePaymentFailure(session, eventType) {
  console.log(`Processing payment failure event: ${eventType}`);

  try {
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
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log(`Received webhook event: ${event.type}`);
    } catch (signatureErr) {
      console.error('Webhook signature verification failed:', signatureErr.message);

      if (process.env.NODE_ENV === 'development' && !sig) {
        console.log('Development mode: Bypassing signature verification for testing');
        try {
          const body = req.body;
          if (typeof body === 'string') {
            event = JSON.parse(body);
          } else {
            event = body;
          }
          console.log('Development mode: Parsed webhook event manually');
        } catch (parseErr) {
          console.error('Failed to parse webhook body:', parseErr);
          return res.status(400).json({
            error: 'Webhook signature verification failed',
            details: signatureErr.message,
            parseError: parseErr.message,
          });
        }
      } else {
        return res.status(400).json({
          error: 'Webhook signature verification failed',
          details: signatureErr.message,
        });
      }
    }

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
    console.error('Error in webhook processing setup:', err);
    return res.status(500).json({
      error: 'Webhook processing setup failed',
      details: err.message,
    });
  }

  try {
    const eventType = event.type;
    const eventData = event.data?.object;

    if (!eventType || !eventData) {
      console.error('Invalid webhook event structure:', { eventType, eventData });
      return res.status(400).json({ error: 'Invalid webhook event structure' });
    }

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
    res.json({
      received: true,
      eventType,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
      eventType: event?.type,
      eventId: event?.id,
      timestamp: new Date().toISOString(),
    });
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
  fixBillAmountPaid,
  validatePaymentAmount,
};
