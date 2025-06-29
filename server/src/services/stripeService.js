const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY);

async function createPaymentIntent(amount, currency) {
  // amount tính bằng đơn vị nhỏ nhất (VND: 1000 = 1k VND)
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
  });
  return paymentIntent.client_secret;
}

module.exports = { createPaymentIntent };
