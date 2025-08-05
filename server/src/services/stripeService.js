const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

async function createCheckoutSession({
  billId,
  amount,
  currency = 'vnd',
  successUrl,
  cancelUrl,
  paymentType,
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

const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body (buffer) cho webhook verify
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data?.object;
  const billId = session?.metadata?.billId;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (billId) {
          const amountPaid = session.amount_total || session.amount_subtotal || 0;

          const totalAmount = await getBillTotalAmount(billId);

          if (amountPaid >= totalAmount) {
            await updateBillStatus(billId, BILL_STATUSES.COMPLETED);
            console.log(`Bill ${billId} updated to COMPLETED`);
          } else if (amountPaid > 0) {
            await updateBillStatus(billId, BILL_STATUSES.PARTIAL);
            console.log(`Bill ${billId} updated to PARTIAL`);
          } else {
            await updateBillStatus(billId, BILL_STATUSES.PENDING);
            console.log(`Bill ${billId} remains PENDING`);
          }
        }
        break;

      case 'payment_intent.succeeded':
        if (billId) {
          const paymentIntent = event.data.object;
          const amountPaid = paymentIntent.amount_received || 0;
          const totalAmount = await getBillTotalAmount(billId);

          if (amountPaid >= totalAmount) {
            await updateBillStatus(billId, BILL_STATUSES.COMPLETED);
            console.log(`Bill ${billId} updated to COMPLETED (payment_intent.succeeded)`);
          } else if (amountPaid > 0) {
            await updateBillStatus(billId, BILL_STATUSES.PARTIAL);
            console.log(`Bill ${billId} updated to PARTIAL (payment_intent.succeeded)`);
          } else {
            await updateBillStatus(billId, BILL_STATUSES.PENDING);
            console.log(`Bill ${billId} remains PENDING`);
          }
        }
        break;

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        if (billId) {
          await updateBillStatus(billId, BILL_STATUSES.CANCELLED);
          console.log(`Bill ${billId} updated to CANCELLED (payment failed or expired)`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái bill:', error);
  }

  res.json({ received: true });
};
module.exports = {
  createCheckoutSession,
  createPaymentExport,
  createPaymentImport,
  processWebhookEvent,
};
