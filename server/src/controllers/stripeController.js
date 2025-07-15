const stripeService = require('../services/stripeService');

// Controller tạo PaymentIntent (nếu cần giữ)
const createPaymentIntentController = async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const clientSecret = await stripeService.createPaymentIntent(amount, currency);
    res.json({ clientSecret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller tạo thanh toán công nợ xuất
const createPaymentExport = async (req, res) => {
  const { paymentId } = req.params; // lấy paymentId từ params URL
  const { amount, successUrl, cancelUrl } = req.body; // nhận thêm amount, success/cancel url từ body vì cần cho Stripe

  try {
    if (!amount) return res.status(400).json({ error: 'Missing amount' });

    const url = await stripeService.createPaymentExport(paymentId, amount, successUrl, cancelUrl);

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller tạo thanh toán công nợ nhập
const createPaymentImport = async (req, res) => {
  // Lấy paymentId từ params (URL)
  const { paymentId } = req.params;
  // Lấy amount, successUrl, cancelUrl từ body
  const { amount, successUrl, cancelUrl } = req.body;

  // Kiểm tra tham số bắt buộc
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId in URL params' });
  }

  if (!amount) {
    return res.status(400).json({ error: 'Missing amount in request body' });
  }

  try {
    // Gọi service tạo Stripe checkout session
    const url = await stripeService.createPaymentImport(paymentId, amount, successUrl, cancelUrl);

    // Trả về url cho frontend redirect
    res.json({ url });
  } catch (err) {
    console.error('Error in createPaymentImport:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

module.exports = {
  createPaymentIntentController,
  createPaymentExport,
  createPaymentImport,
};
