const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2022-11-15' });
const { updateBillStatus, updateBillAmountPaid } = require('./billService');
const { BILL_STATUSES } = require('../utils/constants');
const { Bill } = require('../models');
const {
  convertVNDToUSDCents,
  convertUSDCentsToVND,
  validateMinimumPayment,
  getMinimumPaymentAmount,
} = require('../utils/currencyConverter');
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

async function getBillTotalAmount(billId) {
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // FIX: Kiểm tra và xử lý các trường hợp khác nhau của bill
    let total = 0;

    if (bill.details && Array.isArray(bill.details) && bill.details.length > 0) {
      // Trường hợp bill có details trực tiếp
      total = bill.details.reduce((sum, d) => {
        const quantity = d.quantity || 0;
        const unitPrice = d.unit_price || 0;
        return sum + quantity * unitPrice;
      }, 0);
    } else if (bill.import_order_id && bill.import_order_id.details) {
      // Trường hợp bill liên kết với import order
      total = bill.import_order_id.details.reduce((sum, d) => {
        const quantity = d.quantity || 0;
        const unitPrice = d.unit_price || 0;
        return sum + quantity * unitPrice;
      }, 0);
    } else if (bill.export_order_id && bill.export_order_id.details) {
      // Trường hợp bill liên kết với export order
      total = bill.export_order_id.details.reduce((sum, d) => {
        const quantity = d.quantity || 0;
        const unitPrice = d.unit_price || 0;
        return sum + quantity * unitPrice;
      }, 0);
    }

    console.log(`Bill ${billId} total amount calculation:`, {
      billId,
      total,
      hasDetails: !!(bill.details && bill.details.length > 0),
      hasImportOrder: !!(bill.import_order_id && bill.import_order_id.details),
      hasExportOrder: !!(bill.export_order_id && bill.export_order_id.details),
      unit: 'VND',
    });

    return total;
  } catch (error) {
    console.error(`Error calculating total amount for bill ${billId}:`, error);
    throw error;
  }
}

async function createCheckoutSession({
  billId,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  if (!billId || !amount) throw new Error('Missing billId or amount');

  if (!validateMinimumPayment(amount)) {
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );
  }

  const amountInCents = convertVNDToUSDCents(amount);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Thanh toán công nợ (${paymentType === 'import' ? 'Nhập' : 'Xuất'}) - Phiếu ${billId}`,
          },
          unit_amount: amountInCents,
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

// Tạo checkout session tổng cho nhiều hóa đơn
async function createCheckoutSessionMulti({
  billIds,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentType,
}) {
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0)
    throw new Error('Missing or invalid billIds array');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than zero');

  const bills = await Bill.find({ _id: { $in: billIds } });
  if (bills.length !== billIds.length) throw new Error('Some bills not found');
  if (!validateMinimumPayment(amount))
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );

  const amountInCents = convertVNDToUSDCents(amount);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name:
              paymentType === 'import'
                ? `Thanh toán nhiều hóa đơn nhập - ${billIds.length} phiếu`
                : `Thanh toán nhiều hóa đơn xuất - ${billIds.length} phiếu`,
          },
          unit_amount: amountInCents,
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

async function createPaymentImport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({ billId, amount, successUrl, cancelUrl, paymentType: 'import' });
}

async function createPaymentExport(billId, amount, successUrl, cancelUrl) {
  return createCheckoutSession({ billId, amount, successUrl, cancelUrl, paymentType: 'export' });
}

async function createPaymentImportMulti(billIds, amount, successUrl, cancelUrl) {
  return createCheckoutSessionMulti({
    billIds,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'import',
  });
}

async function createPaymentExportMulti(billIds, amount, successUrl, cancelUrl) {
  return createCheckoutSessionMulti({
    billIds,
    amount,
    successUrl,
    cancelUrl,
    paymentType: 'export',
  });
}

// Thanh toán nhiều lần cho một hóa đơn (PaymentIntent), chỉnh sửa không cộng dồn mà cập nhật theo tiền thực Stripe trả
async function createOrUpdatePaymentIntentForBill({ billId, amount, currency = 'usd' }) {
  const bill = await Bill.findById(billId);
  if (!bill) throw new Error(`Bill ${billId} not found`);

  const totalAmount = await getBillTotalAmount(billId);
  const currentAmountPaid = bill.amountPaid || 0;

  if (currentAmountPaid >= totalAmount) throw new Error(`Bill ${billId} is already fully paid.`);

  const remainingAmount = Math.max(0, totalAmount - currentAmountPaid);
  if (remainingAmount <= 0) {
    throw new Error(`Bill ${billId} is already fully paid.`);
  }

  const amountToCharge = Math.min(amount, remainingAmount);
  if (!amountToCharge || amountToCharge <= 0) {
    throw new Error('Invalid amount to charge');
  }
  if (amount > remainingAmount)
    throw new Error(`Amount ${amount} exceeds remaining balance ${remainingAmount}`);
  if (!validateMinimumPayment(amount))
    throw new Error(
      `Số tiền thanh toán tối thiểu là ${getMinimumPaymentAmount().toLocaleString()} VNĐ`,
    );

  const amountInCents = convertVNDToUSDCents(amount);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata: { billId },
    payment_method_types: ['card'],
  });

  return paymentIntent.client_secret;
}
// Xử lý webhook thanh toán thành công - cập nhật chính xác số tiền đã thanh toán
async function handleSingleBillPayment(billId, amountPaidFromStripe) {
  console.log(`Processing single bill payment for ${billId}:`, {
    amountPaidFromStripe,
    amountPaidFromStripeType: typeof amountPaidFromStripe,
    unit: 'VND',
  });

  // Validate input
  if (!billId) {
    throw new Error('billId is required');
  }

  if (!amountPaidFromStripe || amountPaidFromStripe <= 0) {
    throw new Error(`Invalid amount: ${amountPaidFromStripe}`);
  }

  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new Error(`Bill ${billId} not found`);
  }

  const totalAmount = await getBillTotalAmount(billId);
  const currentAmountPaid = bill.amountPaid || 0;
  const remainingAmount = Math.max(0, totalAmount - currentAmountPaid);

  console.log('Payment calculation details:', {
    billId,
    totalAmount,
    currentAmountPaid,
    amountPaidFromStripe,
    remainingAmount,
    unit: 'VND',
  });

  // Validate payment doesn't exceed remaining amount
  if (amountPaidFromStripe > remainingAmount + 100) {
    // Add small buffer for rounding
    console.error('Payment exceeds remaining amount:', {
      amountPaidFromStripe,
      remainingAmount,
      difference: amountPaidFromStripe - remainingAmount,
    });
    // Don't throw error, just cap the amount
    amountPaidFromStripe = remainingAmount;
  }

  let newAmountPaid;
  let paymentType;

  if (amountPaidFromStripe >= remainingAmount) {
    // Full payment
    newAmountPaid = totalAmount;
    paymentType = 'FULL_PAYMENT';
  } else {
    // Partial payment
    newAmountPaid = currentAmountPaid + amountPaidFromStripe;
    paymentType = 'PARTIAL_PAYMENT';
  }

  // Ensure we don't exceed total amount
  newAmountPaid = Math.min(newAmountPaid, totalAmount);

  const newStatus = newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

  console.log('Final payment calculation:', {
    billId,
    totalAmount,
    currentAmountPaid,
    amountPaidFromStripe,
    newAmountPaid,
    newStatus,
    paymentType,
    unit: 'VND',
  });

  // Update database with retry logic
  let retryCount = 0;
  const maxRetries = 3;
  let updatedBill = null;

  while (retryCount < maxRetries && !updatedBill) {
    try {
      updatedBill = await updateBillAmountPaid(billId, newAmountPaid, newStatus);
      if (updatedBill) {
        console.log(`Bill ${billId} updated successfully on attempt ${retryCount + 1}:`, {
          oldAmountPaid: currentAmountPaid,
          newAmountPaid: updatedBill.amountPaid,
          oldStatus: bill.status,
          newStatus: updatedBill.status,
          paymentType,
          unit: 'VND',
        });
        break;
      }
    } catch (error) {
      retryCount++;
      console.error(`Attempt ${retryCount} to update bill ${billId} failed:`, error);
      if (retryCount >= maxRetries) {
        throw new Error(
          `Failed to update bill ${billId} after ${maxRetries} attempts: ${error.message}`,
        );
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    }
  }

  if (!updatedBill) {
    throw new Error(`Failed to update bill ${billId} - no updated bill returned`);
  }

  return updatedBill;
}

async function handleMultiBillPayment(billIds, totalAmountPaid) {
  console.log('=== MULTI-BILL PAYMENT ===');
  console.log('Multi-bill payment details:', {
    billIds,
    totalAmountPaid,
    totalAmountPaidType: typeof totalAmountPaid,
    unit: 'VND',
  });

  // Validation checks
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    console.error('Invalid billIds:', billIds);
    throw new Error('Invalid billIds array');
  }

  if (!totalAmountPaid || totalAmountPaid <= 0) {
    console.error('Invalid totalAmountPaid:', totalAmountPaid);
    throw new Error('Invalid total amount paid');
  }

  let remainingAmount = totalAmountPaid;
  let processedBills = 0;
  let failedBills = 0;
  const processResults = [];

  // Prepare bills data
  const billsToProcess = [];
  for (const billId of billIds) {
    try {
      const bill = await Bill.findById(billId);
      if (!bill) {
        console.error(`Bill ${billId} not found`);
        failedBills++;
        continue;
      }

      const totalAmount = await getBillTotalAmount(billId);
      const currentAmountPaid = bill.amountPaid || 0;
      const remainingBillAmount = Math.max(0, totalAmount - currentAmountPaid);

      billsToProcess.push({
        billId,
        bill,
        totalAmount,
        currentAmountPaid,
        remainingBillAmount,
      });

      console.log(`Bill ${billId} preparation:`, {
        totalAmount,
        currentAmountPaid,
        remainingBillAmount,
        unit: 'VND',
      });
    } catch (error) {
      console.error(`Error preparing bill ${billId}:`, error);
      failedBills++;
    }
  }

  // Sort by remaining amount (smallest first for better distribution)
  billsToProcess.sort((a, b) => a.remainingBillAmount - b.remainingBillAmount);

  console.log(
    'Bills to process (sorted by remaining amount):',
    billsToProcess.map((b) => ({
      billId: b.billId,
      remainingAmount: b.remainingBillAmount,
      unit: 'VND',
    })),
  );

  // Process each bill
  for (const billData of billsToProcess) {
    try {
      const { billId, bill, totalAmount, currentAmountPaid, remainingBillAmount } = billData;

      console.log(`Processing bill ${billId} (${processedBills + 1}/${billsToProcess.length})`);

      // Check if bill is already fully paid
      if (currentAmountPaid >= totalAmount) {
        console.log(`Bill ${billId} already fully paid, updating status to COMPLETED`);

        if (bill.status !== BILL_STATUSES.COMPLETED) {
          await updateBillAmountPaid(billId, currentAmountPaid, BILL_STATUSES.COMPLETED);
          console.log(`Bill ${billId} status updated to COMPLETED`);
        }

        processResults.push({
          billId,
          status: 'already_completed',
          amountApplied: 0,
        });
        continue;
      }

      // Calculate amount to apply to this bill
      const amountToApply = Math.min(remainingAmount, remainingBillAmount);

      console.log(`Bill ${billId} processing:`, {
        totalAmount,
        currentAmountPaid,
        remainingBillAmount,
        amountToApply,
        remainingAmount,
        unit: 'VND',
      });

      if (amountToApply <= 0) {
        console.log(`Bill ${billId} no remaining amount to apply`);
        processResults.push({
          billId,
          status: 'no_amount_applied',
          amountApplied: 0,
        });
        continue;
      }

      // Calculate new amount paid and status
      const newAmountPaid = currentAmountPaid + amountToApply;
      const newStatus =
        newAmountPaid >= totalAmount ? BILL_STATUSES.COMPLETED : BILL_STATUSES.PARTIAL;

      console.log(`Bill ${billId} amountPaid update:`, {
        currentAmountPaid,
        amountToApply,
        newAmountPaid,
        totalAmount,
        newStatus,
        unit: 'VND',
      });

      // Update database
      const updatedBill = await updateBillAmountPaid(billId, newAmountPaid, newStatus);

      if (updatedBill) {
        console.log(`Bill ${billId} updated successfully:`, {
          oldAmountPaid: currentAmountPaid,
          newAmountPaid: updatedBill.amountPaid,
          oldStatus: bill.status,
          newStatus: updatedBill.status,
          amountApplied: amountToApply,
          unit: 'VND',
        });

        processResults.push({
          billId,
          status: newStatus === BILL_STATUSES.COMPLETED ? 'completed' : 'partial',
          amountApplied: amountToApply,
          newAmountPaid: updatedBill.amountPaid,
          newStatus: updatedBill.status,
        });

        processedBills++;
      } else {
        console.error(`Failed to update bill ${billId}`);
        failedBills++;
        processResults.push({
          billId,
          status: 'update_failed',
          amountApplied: 0,
        });
        continue;
      }

      // Subtract applied amount from remaining
      remainingAmount -= amountToApply;

      console.log(`Remaining amount after processing ${billId}: ${remainingAmount} VND`);

      // Break if no more amount to distribute
      if (remainingAmount <= 0) {
        console.log('All payment amount has been distributed');
      }
    } catch (error) {
      console.error(`Error processing bill ${billData.billId}:`, error);
      failedBills++;
      processResults.push({
        billId: billData.billId,
        status: 'processing_error',
        amountApplied: 0,
        error: error.message,
      });
    }
  }

  // Summary logging
  console.log('Multi-bill payment summary:', {
    totalBills: billIds.length,
    processedBills,
    failedBills,
    remainingAmount,
    totalDistributed: totalAmountPaid - remainingAmount,
    unit: 'VND',
    results: processResults,
  });

  console.log('=== MULTI-BILL PAYMENT - COMPLETED ===');

  return {
    success: true,
    processedBills,
    failedBills,
    remainingAmount,
    totalDistributed: totalAmountPaid - remainingAmount,
    results: processResults,
  };
}

async function handleCheckoutSessionCompleted(session) {
  console.log('=== CHECKOUT SESSION COMPLETED ===');
  console.log('Session data:', {
    sessionId: session.id,
    amountTotal: session.amount_total,
    amountReceived: session.amount_received,
    amountSubtotal: session.amount_subtotal,
    currency: session.currency,
    metadata: session.metadata,
    status: session.status,
    paymentStatus: session.payment_status,
    unit: 'Stripe data',
  });

  // CRITICAL: Check if payment was actually successful
  if (session.payment_status !== 'paid') {
    console.error('Payment not completed successfully:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
    });
    throw new Error(`Payment not successful. Status: ${session.payment_status}`);
  }

  let amountPaid = 0;

  // Prioritize amount_total for checkout sessions (amount_received might be 0 initially)
  if (session.amount_total !== undefined && session.amount_total > 0) {
    amountPaid = convertUSDCentsToVND(session.amount_total);
    console.log('Using amount_total:', {
      rawAmount: session.amount_total,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else if (session.amount_received !== undefined && session.amount_received > 0) {
    amountPaid = convertUSDCentsToVND(session.amount_received);
    console.log('Using amount_received:', {
      rawAmount: session.amount_received,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else {
    console.error('No valid amount data found in session:', {
      amount_total: session.amount_total,
      amount_received: session.amount_received,
      amount_subtotal: session.amount_subtotal,
    });
    throw new Error('No valid amount data found in checkout session');
  }

  // Validate amount
  if (!amountPaid || amountPaid <= 0) {
    throw new Error(`Invalid amount paid: ${amountPaid}`);
  }

  console.log('Final amount calculation:', {
    amountPaid,
    amountPaidType: typeof amountPaid,
    unit: 'VND',
  });

  // Parse metadata safely with better error handling
  const metadata = session?.metadata;
  if (!metadata) {
    console.error('No metadata found in session');
    throw new Error('No metadata found in checkout session');
  }

  console.log('Metadata parsing:', {
    metadata: metadata,
    billIds: metadata.billIds,
    billId: metadata.billId,
    paymentType: metadata.paymentType,
  });

  const billIdsStr = metadata.billIds || '';
  const billIds = billIdsStr ? billIdsStr.split(',').filter((id) => id.trim()) : [];
  const singleBillId = metadata.billId;

  console.log('Bill processing decision:', {
    billIds,
    singleBillId,
    isMultiPayment: billIds.length > 0,
    isSinglePayment: !!singleBillId,
    amountPaid,
    unit: 'VND',
  });

  // Process payments
  if (billIds.length > 0) {
    console.log(`Processing multi-bill payment for ${billIds.length} bills:`, billIds);
    try {
      const result = await handleMultiBillPayment(billIds, amountPaid);
      console.log('Multi-bill payment processed successfully:', result);

      // Additional validation - check if any bills were actually updated
      if (result.processedBills === 0) {
        console.error('No bills were processed successfully');
        throw new Error('Failed to process any bills in multi-payment');
      }

      return result;
    } catch (error) {
      console.error('Error processing multi-bill payment:', error);
      throw error;
    }
  } else if (singleBillId) {
    console.log(`Processing single bill payment for ${singleBillId}`);
    try {
      await handleSingleBillPayment(singleBillId, amountPaid);
      console.log('Single bill payment processed successfully');

      // Verify the bill was actually updated
      const updatedBill = await Bill.findById(singleBillId);
      if (!updatedBill) {
        throw new Error(`Bill ${singleBillId} not found after update`);
      }

      console.log('Bill verification after update:', {
        billId: singleBillId,
        amountPaid: updatedBill.amountPaid,
        status: updatedBill.status,
      });

      return { billId: singleBillId, updatedBill };
    } catch (error) {
      console.error('Error processing single bill payment:', error);
      throw error;
    }
  } else {
    console.error('No bill IDs found in webhook metadata:', metadata);
    throw new Error('No bill IDs found in webhook metadata');
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('=== PAYMENT INTENT SUCCEEDED ===');
  console.log('PaymentIntent data:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amount_received,
    amountCapturable: paymentIntent.amount_capturable,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
    unit: 'Stripe data',
  });

  const billId = paymentIntent.metadata?.billId;
  if (!billId) {
    console.error('No billId found in payment intent metadata');
    return;
  }

  // FIX: Ưu tiên amount_received (số tiền thực tế nhận được)
  let amountPaid = 0;
  if (paymentIntent.amount_received !== undefined) {
    amountPaid = convertUSDCentsToVND(paymentIntent.amount_received);
    console.log('Using amount_received:', {
      rawAmount: paymentIntent.amount_received,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else if (paymentIntent.amount !== undefined) {
    amountPaid = convertUSDCentsToVND(paymentIntent.amount);
    console.log('Using amount:', {
      rawAmount: paymentIntent.amount,
      convertedAmount: amountPaid,
      unit: 'USD Cents → VND',
    });
  } else {
    console.error('No amount data found in payment intent');
    throw new Error('No amount data found in payment intent');
  }

  console.log('Final amount calculation:', {
    billId,
    amountPaid,
    amountPaidType: typeof amountPaid,
    unit: 'VND',
  });

  await handleSingleBillPayment(billId, amountPaid);

  console.log(`Payment intent ${paymentIntent.id} processed successfully`);
  console.log('=== PAYMENT INTENT SUCCEEDED - PROCESSED ===');
}

async function handlePaymentFailure(session, eventType) {
  const billIdsStr = session?.metadata?.billIds || '';
  const billIds = billIdsStr ? billIdsStr.split(',') : [];
  const singleBillId = session?.metadata?.billId;

  if (billIds.length > 0) {
    for (const billId of billIds) {
      await updateBillStatus(billId, BILL_STATUSES.CANCELLED);
      console.log(`Bill ${billId} CANCELED due to payment failure (multi)`);
    }
  } else if (singleBillId) {
    await updateBillStatus(singleBillId, BILL_STATUSES.CANCELLED);
    console.log(`Bill ${singleBillId} CANCELED due to payment failure (single)`);
  }
}

const processWebhookEvent = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`Received webhook event: ${event.type} - ${event.id}`);
  } catch (signatureErr) {
    console.error('Webhook signature verification failed:', signatureErr.message);
    return res
      .status(400)
      .json({ error: 'Webhook signature verification failed', details: signatureErr.message });
  }

  const eventType = event.type;
  const eventData = event.data?.object;

  console.log(`Processing webhook event: ${eventType}`, {
    eventId: event.id,
    metadata: eventData?.metadata,
    amount_total: eventData?.amount_total,
    payment_status: eventData?.payment_status,
    status: eventData?.status,
  });

  try {
    let result = null;

    switch (eventType) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(eventData);
        console.log('Checkout session processing result:', result);
        break;

      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(eventData);
        console.log('Payment intent processing result:', result);
        break;

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(eventData, eventType);
        console.log(`Payment failure handled for event: ${eventType}`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Return detailed response
    return res.json({
      received: true,
      eventType,
      eventId: event.id,
      processed: true,
      result: result ? 'success' : 'no_action_required',
    });
  } catch (error) {
    console.error('Error processing webhook event:', {
      eventType,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
    });

    // Return error but still acknowledge receipt
    return res.status(500).json({
      received: true,
      eventType,
      eventId: event.id,
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentImport,
  createPaymentExport,
  createCheckoutSessionMulti,
  createPaymentImportMulti,
  createPaymentExportMulti,
  createOrUpdatePaymentIntentForBill,
  processWebhookEvent,
};
