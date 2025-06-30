const { createPaymentIntent } = require('./stripeService');
const Stripe = require('stripe');

// Sửa mock Stripe để trả về instance chính xác
jest.mock('stripe', () => {
  const mockPaymentIntents = {
    create: jest.fn(),
  };

  return jest.fn(() => ({
    paymentIntents: mockPaymentIntents,
  }));
});

describe('Stripe Service', () => {
  let stripeInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    stripeInstance = new Stripe();
    process.env.STRIPE_API_KEY = 'sk_test_123';
  });

  // Test case thành công
  it('tạo payment intent thành công', async () => {
    const amount = 10000;
    const currency = 'vnd';
    const mockClientSecret = 'pi_123_secret_abc';

    stripeInstance.paymentIntents.create.mockResolvedValue({
      client_secret: mockClientSecret,
    });

    const result = await createPaymentIntent(amount, currency);
    expect(result).toBe(mockClientSecret);
    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith({
      amount,
      currency,
    });
  });

  // Sửa test case lỗi: Sử dụng .rejects.toThrowError()
  it('xử lý lỗi khi tạo payment intent', async () => {
    const amount = 5000;
    const currency = 'vnd';
    const mockError = new Error('Stripe API error');

    stripeInstance.paymentIntents.create.mockRejectedValue(mockError);

    // Sử dụng .rejects.toThrowError() thay vì .rejects.toThrow()
    await expect(createPaymentIntent(amount, currency)).rejects.toThrowError('Stripe API error');
  });

  // Sửa test case currency không hợp lệ
  it('kiểm tra xử lý currency không hợp lệ', async () => {
    const amount = 10000;
    const invalidCurrency = 'usd';
    const mockError = new Error('Invalid currency: usd');

    stripeInstance.paymentIntents.create.mockRejectedValue(mockError);

    // Sử dụng .rejects.toThrowError() với regex linh hoạt
    await expect(createPaymentIntent(amount, invalidCurrency)).rejects.toThrowError(
      /Invalid currency: usd/,
    );
  });
});
