// payment.controller.js

const { createPaymentIntent } = require('../services/stripeService');

const createPaymentIntentController = async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const clientSecret = await createPaymentIntent(amount, currency);
    res.json({ clientSecret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPaymentIntentController };
