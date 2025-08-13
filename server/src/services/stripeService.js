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
  try {
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      throw new Error('Missing or invalid billIds array');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate bills exist
    const bills = await Bill.find({ _id: { $in: billIds } });
    if (bills.length !== billIds.length) {
      throw new Error('Some bills not found');
    }

    const billsStr = billIds.join(', ');

    console.log('createCheckoutSessionMulti debug:', {
      billIds,
      billIdsStr: billIds.join(','),
      amount,
      currency,
      paymentType,
      billsFound: bills.length,
    });

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

async function createOrUpdatePaymentIntentForBill({ billId, amount, currency = 'vnd' }) {
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    const totalAmount = await getBillTotalAmount(billId);
    const currentAmountPaid = bill.amountPaid || 0;

    // FIX: Kiểm tra nếu bill đã được thanh toán đủ
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

    // FIX: Chỉ validate nếu remainingAmount > 0
    if (remainingAmount > 0 && amount > remainingAmount) {
      throw new Error(`Amount ${amount} exceeds remaining balance ${remainingAmount}`);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { billId },
      payment_method_types: ['card'],
    });

    console.log('PaymentIntent created successfully:', {
      billId,
      amount,
      paymentIntentId: paymentIntent.id,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    throw error;
  }
}

// Function để sửa data sai trong database
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
      currentAmountPaid,
      totalAmount,
      difference: currentAmountPaid - totalAmount,
      isAbnormal: currentAmountPaid > totalAmount * 10,
    });

    // Nếu amountPaid quá lớn (bất thường), reset về 0
    if (currentAmountPaid > totalAmount * 10) {
      console.log(`Resetting amountPaid from ${currentAmountPaid} to 0`);
      await Bill.findByIdAndUpdate(billId, {
        amountPaid: 0,
        status: BILL_STATUSES.PENDING,
      });
      console.log(`Bill ${billId} amountPaid reset to 0`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing bill ${billId}:`, error);
    return false;
  }
}

// Export function này để có thể gọi từ bên ngoài
module.exports = {
  // ... existing exports
  fixBillAmountPaid,
};

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

      // FIX: Kiểm tra và cập nhật status nếu bill đã hoàn thành
      if (currentAmountPaid >= totalAmount) {
        console.log(`Bill ${billId} already fully paid, updating status to COMPLETED`);

        // Cập nhật status thành COMPLETED nếu chưa phải
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

      const newAmountPaid = currentAmountPaid + amountToApply;
      const newStatus =
        newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

      await Bill.findByIdAndUpdate(billId, {
        amountPaid: newAmountPaid,
        status: newStatus,
      });

      console.log(`Bill ${billId} updated: amountPaid=${newAmountPaid}, status=${newStatus}`);
      remainingAmount -= amountToApply;
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
  try {
    const billId = paymentIntent.metadata?.billId;

    // FIX: Sử dụng amount thay vì amount_received
    const amountPaid = paymentIntent.amount || 0;

    console.log('PaymentIntent succeeded debug:', {
      billId,
      amount: paymentIntent.amount,
      amount_received: paymentIntent.amount_received,
      amount_capturable: paymentIntent.amount_capturable,
      amountPaid,
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
      // Xử lý nhiều hóa đơn
      for (const billId of billIds) {
        await updateBillStatus(billId, BILL_STATUSES.CANCELLED);
        console.log(`Bill ${billId} CANCELED due to payment failure (multi)`);
      }
    } else if (singleBillId) {
      // Xử lý một hóa đơn
      await updateBillStatus(singleBillId, BILL_STATUSES.CANCELLED);
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
    // Kiểm tra webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log(`Received webhook event: ${event.type}`);
    } catch (signatureErr) {
      console.error('Webhook signature verification failed:', signatureErr.message);

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
  fixBillAmountPaid,
};
