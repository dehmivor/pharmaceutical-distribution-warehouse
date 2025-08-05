const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });

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
          unit_amount: amount, // Số tiền (đơn vị nhỏ nhất)
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${frontendUrl}/success`,
    cancel_url: `${frontendUrl}/not-found`,
    metadata: {
      billId,
      paymentType,
    },
  });

  return session.url; // trả về url checkout để redirect client
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

module.exports = {
  createCheckoutSession,
  createPaymentExport,
  createPaymentImport,
};
