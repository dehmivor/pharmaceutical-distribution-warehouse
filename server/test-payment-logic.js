/**
 * Test file để kiểm tra logic thanh toán
 * Chạy: node test-payment-logic.js
 */

// Mock data
const mockBill = {
  _id: '68a48d7c287816da28ab088e',
  amountPaid: 0,
  status: 'PENDING',
  details: [{ quantity: 1, unit_price: 649995 }],
};

const mockTotalAmount = 649995; // VND
const mockAmountPaidFromStripe = 649995; // VND (thanh toán toàn phần)

// Test logic thanh toán
function testPaymentLogic() {
  console.log('=== TESTING PAYMENT LOGIC ===');
  console.log('Mock data:', {
    billId: mockBill._id,
    totalAmount: mockTotalAmount,
    currentAmountPaid: mockBill.amountPaid,
    amountPaidFromStripe: mockAmountPaidFromStripe,
    unit: 'VND',
  });

  // Logic cũ (sai)
  const oldLogic = Math.min(mockBill.amountPaid + mockAmountPaidFromStripe, mockTotalAmount);
  console.log('OLD LOGIC (WRONG):', {
    calculation: `${mockBill.amountPaid} + ${mockAmountPaidFromStripe} = ${mockBill.amountPaid + mockAmountPaidFromStripe}`,
    result: oldLogic,
    issue: 'Cộng dồn sai khi thanh toán toàn phần',
  });

  // Logic mới (đúng)
  let newAmountPaid;
  let paymentType;

  if (mockAmountPaidFromStripe >= mockTotalAmount) {
    // Thanh toán toàn phần hoặc vượt quá
    newAmountPaid = mockTotalAmount;
    paymentType = 'FULL_PAYMENT';
    console.log(`FULL PAYMENT DETECTED: ${mockAmountPaidFromStripe} >= ${mockTotalAmount}`);
  } else {
    // Thanh toán một phần
    newAmountPaid = mockBill.amountPaid + mockAmountPaidFromStripe;
    paymentType = 'PARTIAL_PAYMENT';
    console.log(`PARTIAL PAYMENT DETECTED: ${mockAmountPaidFromStripe} < ${mockTotalAmount}`);
  }

  // Đảm bảo không vượt quá tổng tiền
  newAmountPaid = Math.min(newAmountPaid, mockTotalAmount);

  const newStatus = newAmountPaid >= mockTotalAmount ? 'COMPLETED' : 'PARTIAL';

  console.log('NEW LOGIC (CORRECT):', {
    paymentType,
    newAmountPaid,
    newStatus,
    calculation: `Amount from Stripe: ${mockAmountPaidFromStripe}, Total: ${mockTotalAmount}`,
    result: newAmountPaid,
  });

  console.log('=== TEST COMPLETED ===');
}

// Chạy test
testPaymentLogic();
