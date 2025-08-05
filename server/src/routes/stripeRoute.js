// payment.route.js
const express = require('express');
const stripeController = require('../controllers/stripeController');
const router = express.Router();

router.post('/create-payment-intent', stripeController.createPaymentIntentController);
router.post('/create-payment-import/:paymentId', stripeController.createPaymentImport);
router.post('/create-payment-export/:paymentId', stripeController.createPaymentExport);
router.post('/webhook', stripeController.handleWebhook);

module.exports = router;
