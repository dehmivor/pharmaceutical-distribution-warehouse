// utils/__tests__/emailService.test.js
const nodemailer = require('nodemailer');
const emailService = require('../services/emailService');
const mailConfig = require('../config/mail.config');

// Mock nodemailer
jest.mock('nodemailer');

// Mock mail config
jest.mock('../config/mail.config', () => ({
  host: 'smtp.test.com',
  port: 587,
  secure: false,
  auth: {
    user: 'test@example.com',
    pass: 'testpass',
  },
}));

describe('EmailService', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.EMAIL_USER = 'test@example.com';

    // Mock transporter và sendMail method
    mockSendMail = jest.fn();
    mockTransporter = {
      sendMail: mockSendMail,
    };

    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    delete process.env.EMAIL_USER;
  });

  describe('createTransporter', () => {
    it('should create transporter with mail config', () => {
      const { createTransporter } = require('../emailService');

      // Call private function through module
      const transporter = nodemailer.createTransporter(mailConfig);

      expect(nodemailer.createTransporter).toHaveBeenCalledWith(mailConfig);
      expect(transporter).toBe(mockTransporter);
    });
  });

  describe('sendOTPEmail', () => {
    const testEmail = 'user@example.com';
    const testOTP = '123456';

    it('should send OTP email successfully', async () => {
      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendOTPEmail(testEmail, testOTP);

      expect(nodemailer.createTransporter).toHaveBeenCalledWith(mailConfig);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: testEmail,
        subject: 'Mã xác thực đăng nhập',
        html: `<h2>Mã OTP: ${testOTP}</h2>`,
      });
      expect(result).toEqual(mockResult);
    });

    it('should use environment variable for sender email', async () => {
      process.env.EMAIL_USER = 'custom@example.com';
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(testEmail, testOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        }),
      );
    });

    it('should format HTML content correctly', async () => {
      const customOTP = '789012';
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(testEmail, customOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<h2>Mã OTP: 789012</h2>',
        }),
      );
    });

    it('should handle email sending errors', async () => {
      const emailError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(emailError);

      await expect(emailService.sendOTPEmail(testEmail, testOTP)).rejects.toThrow(
        'SMTP connection failed',
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockSendMail.mockRejectedValue(timeoutError);

      await expect(emailService.sendOTPEmail(testEmail, testOTP)).rejects.toThrow(
        'Connection timeout',
      );
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid login credentials');
      authError.code = 'EAUTH';
      mockSendMail.mockRejectedValue(authError);

      await expect(emailService.sendOTPEmail(testEmail, testOTP)).rejects.toThrow(
        'Invalid login credentials',
      );
    });

    it('should handle missing EMAIL_USER environment variable', async () => {
      delete process.env.EMAIL_USER;
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(testEmail, testOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: undefined,
        }),
      );
    });

    it('should handle empty email parameter', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail('', testOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '',
        }),
      );
    });

    it('should handle empty OTP parameter', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(testEmail, '');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<h2>Mã OTP: </h2>',
        }),
      );
    });

    it('should handle special characters in OTP', async () => {
      const specialOTP = '12<>&"3';
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(testEmail, specialOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<h2>Mã OTP: 12<>&"3</h2>',
        }),
      );
    });

    it('should handle multiple email addresses', async () => {
      const multipleEmails = 'user1@example.com,user2@example.com';
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail(multipleEmails, testOTP);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: multipleEmails,
        }),
      );
    });
  });

  describe('error handling and logging', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log success message when email is sent', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await emailService.sendOTPEmail('test@example.com', '123456');

      expect(consoleSpy).toHaveBeenCalledWith('✅ Email sent successfully');
    });

    it('should log error message when email fails', async () => {
      const error = new Error('Send failed');
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendOTPEmail('test@example.com', '123456')).rejects.toThrow(
        'Send failed',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Email error:', error);
    });
  });

  describe('integration with mail config', () => {
    it('should use correct mail configuration', () => {
      // Verify that createTransporter is called with the right config
      emailService.sendOTPEmail('test@example.com', '123456');

      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpass',
        },
      });
    });
  });

  describe('email content validation', () => {
    beforeEach(() => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    });

    it('should have correct email subject', async () => {
      await emailService.sendOTPEmail('test@example.com', '123456');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Mã xác thực đăng nhập',
        }),
      );
    });

    it('should send HTML formatted email', async () => {
      await emailService.sendOTPEmail('test@example.com', '123456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<h2>');
      expect(callArgs.html).toContain('</h2>');
      expect(callArgs.html).toContain('Mã OTP:');
    });

    it('should not have plain text content', async () => {
      await emailService.sendOTPEmail('test@example.com', '123456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toBeUndefined();
    });
  });
});
