const { createPaymentIntent } = require('./stripeService');
const Stripe = require('stripe');

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
    process.env.STRIPE_API_KEY =
      'sk_test_51RdsAu8KJWi0UhfdtktGOLcjkAtEK1HiCP3zbsIE2bgmZKEMeHw17EONVRbacJSxjfbsruXi702WP7icJlKpcRnv0084QwdEwh';
  });

  it('tạo payment intent thành công', async () => {
    const amount = 10000;
    const currency = 'vnd';
    const mockClientSecret =
      'sk_test_51RdsAu8KJWi0UhfdtktGOLcjkAtEK1HiCP3zbsIE2bgmZKEMeHw17EONVRbacJSxjfbsruXi702WP7icJlKpcRnv0084QwdEwh';

    stripeInstance.paymentIntents.create.mockRejectedValue(new Error('Stripe API error'));

    const result = await createPaymentIntent(amount, currency);
    expect(result).toBe(mockClientSecret);
    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith({
      amount,
      currency,
    });
  });

  it('xử lý lỗi khi tạo payment intent', async () => {
    const amount = 5000000000;
    const currency = 'vnd';
    const mockError = new Error('Stripe API error');

    stripeInstance.paymentIntents.create.mockRejectedValue(mockError);
    await expect(createPaymentIntent(amount, currency)).rejects.toThrowError('Stripe API error');
  });

  it('kiểm tra xử lý currency không hợp lệ', async () => {
    const amount = 10000;
    const invalidCurrency = 'usd';
    const mockError = new Error('Invalid currency: usd');

    stripeInstance.paymentIntents.create.mockRejectedValue(mockError);
    await expect(createPaymentIntent(amount, invalidCurrency)).rejects.toThrowError(
      /Invalid currency: usd/,
    );
  });

  // Thêm hook afterAll để báo cáo hoàn thành
  afterAll(() => {
    console.log('✅ Đã sẵn sàng để test thành công!');
  });
});
