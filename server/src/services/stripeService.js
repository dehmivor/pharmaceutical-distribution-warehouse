const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const { Bill } = require('../models');
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

async function getBillTotalAmount(billId) {
  const bill = await Bill.findById(billId);
  return bill.details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
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
    currency: 'vnd',
    successUrl,
    cancelUrl,
    paymentType: 'import',
  });
}

async function createPaymentExport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({
    billId,
    amount,
    currency: 'vnd',
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
    currency: 'vnd',
    successUrl,
    cancelUrl,
    paymentType: 'import',
  });
}

async function createPaymentExportMulti(billIds, amount, successUrl, cancelUrl) {
  return createCheckoutSessionMulti({
    billIds,
    amount,
    currency: 'vnd',
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
  return paymentIntent.client_secret;
}
const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data?.object;
  const eventType = event.type;

  try {
    if (eventType === 'checkout.session.completed') {
      const billIdsStr = session?.metadata?.billIds || '';
      const billIds = billIdsStr ? billIdsStr.split('|') : [];
      const singleBillId = session?.metadata?.billId;

      const amountPaid = session.amount_total || session.amount_subtotal || 0;

      if (billIds.length > 0) {
        // Nhiều hóa đơn
        for (const billId of billIds) {
          const totalAmount = await getBillTotalAmount(billId);
          if (eventType === 'checkout.session.completed' && billIds.length > 0) {
            const amountPaidTotal = session.amount_total;
            let remainingAmount = amountPaidTotal;

            for (const billId of billIds) {
              const bill = await Bill.findById(billId);
              const totalAmount = await getBillTotalAmount(billId);
              const amountToApply = Math.min(remainingAmount, totalAmount - bill.amountPaid);

              const newAmountPaid = bill.amountPaid + amountToApply;
              const newStatus =
                newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

              await Bill.findByIdAndUpdate(billId, {
                amountPaid: newAmountPaid,
                status: newStatus,
              });
              remainingAmount -= amountToApply;

              if (remainingAmount <= 0) break;
            }
          }
          console.log(`Bill ${billId} updated via checkout.session.completed multi`);
        }
      } else if (singleBillId) {
        // Một hóa đơn
        const totalAmount = await getBillTotalAmount(singleBillId);
        if (eventType === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object;
          const billId = paymentIntent.metadata.billId;
          const amountPaidThisTime = paymentIntent.amount_received;

          const bill = await Bill.findById(billId);
          const newAmountPaid = bill.amountPaid + amountPaidThisTime;
          const totalAmount = await getBillTotalAmount(billId);

          let newStatus = bill.status;
          if (newAmountPaid >= totalAmount) {
            newStatus = BILL_STATUSES.COMPLETED;
          } else if (newAmountPaid > 0) {
            newStatus = BILL_STATUSES.PARTIAL;
          }

          await Bill.findByIdAndUpdate(billId, { amountPaid: newAmountPaid, status: newStatus });
        }
        console.log(`Bill ${singleBillId} updated via checkout.session.completed single`);
      }
    } else if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const billId = paymentIntent.metadata.billId;
      const amountPaid = paymentIntent.amount_received || 0;

      if (billId) {
        const totalAmount = await getBillTotalAmount(billId);
        if (amountPaid >= totalAmount) {
          await updateBillStatus(billId, BILL_STATUSES.COMPLETED);
          console.log(`Bill ${billId} updated COMPLETED via payment_intent.succeeded`);
        } else if (amountPaid > 0) {
          await updateBillStatus(billId, BILL_STATUSES.PARTIAL);
          console.log(`Bill ${billId} updated PARTIAL via payment_intent.succeeded`);
        } else {
          await updateBillStatus(billId, BILL_STATUSES.PENDING);
          console.log(`Bill ${billId} remains PENDING via payment_intent.succeeded`);
        }
      }
    } else if (
      eventType === 'checkout.session.expired' ||
      eventType === 'checkout.session.async_payment_failed' ||
      eventType === 'payment_intent.payment_failed'
    ) {
      const billIdsStr = session?.metadata?.billIds || '';
      const billIds = billIdsStr ? billIdsStr.split('|') : [];
      const singleBillId = session?.metadata?.billId;

      if (billIds.length > 0) {
        for (const billId of billIds) {
          await updateBillStatus(billId, BILL_STATUSES.CANCELED);
          console.log(`Bill ${billId} CANCELED due to payment failure (multi)`);
        }
      } else if (singleBillId) {
        await updateBillStatus(singleBillId, BILL_STATUSES.CANCELED);
        console.log(`Bill ${singleBillId} CANCELED due to payment failure (single)`);
      }
    } else {
      console.log(`Unhandled event type ${eventType}`);
    }
  } catch (error) {
    console.error('Error updating bill status:', error);
  }

  res.json({ received: true });
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
