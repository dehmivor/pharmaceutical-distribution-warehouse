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
          unit_amount: amount,
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

const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // phải là raw body (buffer)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Xử lý các event bạn quan tâm
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const billId = session.metadata.billId;

      try {
        await updateBillStatus(billId, 'COMPLETED');
        console.log(`Bill ${billId} updated to COMPLETED`);
      } catch (error) {
        console.error('Lỗi cập nhật trạng thái bill:', error);
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      const billId = session.metadata.billId;

      try {
        await updateBillStatus(billId, 'CANCELED');
        console.log(`Bill ${billId} updated to CANCELED (expired)`);
      } catch (error) {
        console.error('Lỗi cập nhật trạng thái bill:', error);
      }
      break;
    }
    // Thêm các case khác nếu cần
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Gửi phản hồi thành công cho Stripe
  res.json({ received: true });
};

module.exports = {
  createCheckoutSession,
  createPaymentExport,
  createPaymentImport,
  processWebhookEvent,
};
