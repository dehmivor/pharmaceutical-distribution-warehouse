const express = require('express');
const { stripeController } = require('../controllers');
const router = express.Router();

// Thanh toán 1 hóa đơn nhiều lần (partial payment) - POST /payment-intent
router.post('/payment-intent', stripeController.createPaymentIntentController);

// Thanh toán nhiều hóa đơn 1 lần (gom tổng) - POST /payments/multi
router.post('/payments/multi', stripeController.createMultiPayment);

// Thanh toán 1 hóa đơn 1 lần (checkout session) - POST /payments/:paymentId
router.post('/payments/:paymentId', stripeController.createPaymentSingle);

router.post('/webhook', stripeController.handleWebhook);
module.exports = router;
