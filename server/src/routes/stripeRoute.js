// payment.route.js
const express = require('express');
const { createPaymentIntentController } = require('../controllers/stripeController');
const router = express.Router();

router.post('/create-payment-intent', createPaymentIntentController);

module.exports = router;
