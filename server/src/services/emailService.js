const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail.config');

const createTransporter = () => {
  return nodemailer.createTransport(mailConfig);
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sử dụng biến môi trường
      to: email,
      subject: 'Mã xác thực đăng nhập',
      html: `<h2>Mã OTP: ${otp}</h2>`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

module.exports = { sendOTPEmail };
