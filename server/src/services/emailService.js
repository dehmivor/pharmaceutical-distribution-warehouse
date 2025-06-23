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
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    // Tạo reset URL với token
    const resetURL = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Đặt lại mật khẩu tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px;">Yêu cầu đặt lại mật khẩu</h2>
            <p style="color: #666; font-size: 16px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #333;">
              Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetURL}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Đặt lại mật khẩu
              </a>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
              Hoặc copy và paste link sau vào trình duyệt:
            </p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #495057;">
              ${resetURL}
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">
              ⚠️ Lưu ý quan trọng:
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6;">
              <li>Link này chỉ có hiệu lực trong <strong>10 phút</strong></li>
              <li>Chỉ sử dụng được <strong>một lần duy nhất</strong></li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Email này được gửi tự động, vui lòng không trả lời.<br>
              Nếu cần hỗ trợ, liên hệ: <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}" style="color: #007bff;">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Yêu cầu đặt lại mật khẩu
        
        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        
        Để đặt lại mật khẩu, vui lòng truy cập link sau:
        ${resetURL}
        
        Lưu ý:
        - Link này chỉ có hiệu lực trong 10 phút
        - Chỉ sử dụng được một lần duy nhất
        - Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
        
        Nếu cần hỗ trợ, liên hệ: ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reset password email sent successfully to:', email);
    console.log('🔗 Reset URL:', resetURL);
  } catch (error) {
    console.error('❌ Error sending reset password email:', error);
    throw new Error('Failed to send reset password email');
  }
};

const sendPasswordResetConfirmation = async (email, name) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mật khẩu đã được đặt lại thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Mật khẩu đã được đặt lại</h2>
          <p>Xin chào ${name},</p>
          <p>Mật khẩu của bạn đã được đặt lại thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
          <p>Nếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset confirmation email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
};

module.exports = { sendOTPEmail, sendResetPasswordEmail, sendPasswordResetConfirmation };
