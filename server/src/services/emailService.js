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

// ✨ THÊM HÀM MỚI: Gửi email kích hoạt tài khoản
const sendActivationEmail = async (
  email,
  activationToken,
  otp,
  tempPassword,
  role,
  supervisorName,
) => {
  try {
    const transporter = createTransporter();

    // Tạo activation URL với token[1]
    const activationURL = `${process.env.CLIENT_URL}/activate-account?token=${activationToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kích hoạt tài khoản - Chào mừng bạn đến với hệ thống',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Chào mừng bạn!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tài khoản của bạn đã được tạo thành công</p>
          </div>

          <!-- Thông tin tài khoản -->
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; display: flex; align-items: center;">
              👤 Thông tin tài khoản
            </h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>👔 Vai trò:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
              <p style="margin: 5px 0;"><strong>🔑 Mật khẩu tạm:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
              <p style="margin: 5px 0;"><strong>👨‍💼 Được tạo bởi:</strong> ${supervisorName}</p>
            </div>
          </div>

          <!-- OTP và Activation -->
          <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); padding: 25px; border-radius: 8px; margin: 20px 0; color: white; text-align: center;">
            <h3 style="margin-top: 0; display: flex; align-items: center; justify-content: center;">
              🔐 Mã kích hoạt OTP
            </h3>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Mã OTP của bạn:</p>
              <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">${otp}</p>
            </div>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Mã này có hiệu lực trong 24 giờ</p>
          </div>

          <!-- Activation Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationURL}" 
               style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
              🚀 Kích hoạt tài khoản ngay
            </a>
          </div>

          <!-- Activation Link -->
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #1976d2; font-weight: bold;">🔗 Link kích hoạt:</p>
            <p style="word-break: break-all; background-color: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #333; border: 1px solid #ddd; margin: 0;">
              ${activationURL}
            </p>
          </div>

          <!-- Hướng dẫn -->
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0; display: flex; align-items: center;">
              📋 Hướng dẫn kích hoạt
            </h4>
            <ol style="color: #856404; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Nhấp vào nút "Kích hoạt tài khoản" hoặc truy cập link phía trên</li>
              <li>Nhập mã OTP: <strong>${otp}</strong></li>
              <li>Tạo mật khẩu mới cho tài khoản</li>
              <li>Hoàn tất quá trình và đăng nhập</li>
            </ol>
          </div>

          <!-- Lưu ý bảo mật -->
          <div style="border-left: 4px solid #dc3545; padding: 15px; background-color: #f8d7da; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <h4 style="color: #721c24; margin-top: 0;">⚠️ Lưu ý bảo mật</h4>
            <ul style="color: #721c24; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Link kích hoạt có hiệu lực trong <strong>24 giờ</strong></li>
              <li>Mã OTP chỉ sử dụng được <strong>một lần duy nhất</strong></li>
              <li>Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên</li>
              <li>Không chia sẻ thông tin này với bất kỳ ai</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              📧 Email này được gửi tự động, vui lòng không trả lời<br>
              💬 Cần hỗ trợ? Liên hệ: <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}" style="color: #007bff;">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>
            </p>
            <p style="color: #ccc; font-size: 12px; margin: 10px 0 0 0;">
              © 2025 Hệ thống quản lý. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
      // Text version cho email clients không hỗ trợ HTML[2]
      text: `
        🎉 CHÀO MỪNG BẠN ĐẾN VỚI HỆ THỐNG!
        
        Tài khoản của bạn đã được tạo thành công.
        
        THÔNG TIN TÀI KHOẢN:
        📧 Email: ${email}
        👔 Vai trò: ${role}
        🔑 Mật khẩu tạm: ${tempPassword}
        👨‍💼 Được tạo bởi: ${supervisorName}
        
        🔐 MÃ KÍCH HOẠT OTP: ${otp}
        
        KÍCH HOẠT TÀI KHOẢN:
        Truy cập link sau để kích hoạt tài khoản:
        ${activationURL}
        
        HƯỚNG DẪN:
        1. Truy cập link kích hoạt
        2. Nhập mã OTP: ${otp}
        3. Tạo mật khẩu mới
        4. Hoàn tất và đăng nhập
        
        LỢU Ý BẢO MẬT:
        - Link có hiệu lực trong 24 giờ
        - Mã OTP chỉ dùng một lần
        - Đổi mật khẩu sau lần đăng nhập đầu
        - Không chia sẻ thông tin này
        
        Cần hỗ trợ? Liên hệ: ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Activation email sent successfully to:', email);
    console.log('🔗 Activation URL:', activationURL);
    console.log('🔐 OTP Code:', otp);
    return result;
  } catch (error) {
    console.error('❌ Error sending activation email:', error);
    throw new Error('Failed to send activation email');
  }
};

// ✨ THÊM HÀM: Gửi email thông báo tài khoản đã được kích hoạt
const sendAccountActivatedNotification = async (email, name, role) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Tài khoản đã được kích hoạt thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px;">
            <h1 style="margin: 0;">🎉 Chúc mừng!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Tài khoản của bạn đã được kích hoạt</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">✅ Thông tin kích hoạt</h3>
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>👤 Tên:</strong> ${name || 'Người dùng'}</p>
            <p><strong>👔 Vai trò:</strong> ${role}</p>
            <p><strong>⏰ Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;">🚀 Bước tiếp theo</h4>
            <ul style="color: #2e7d32; line-height: 1.6;">
              <li>Đăng nhập vào hệ thống với email và mật khẩu mới</li>
              <li>Khám phá các tính năng phù hợp với vai trò của bạn</li>
              <li>Cập nhật thông tin cá nhân nếu cần</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              🔗 Đăng nhập ngay
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Cần hỗ trợ? Liên hệ: <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Account activation notification sent to:', email);
  } catch (error) {
    console.error('❌ Error sending activation notification:', error);
    throw new Error('Failed to send activation notification');
  }
};

// ✨ THÊM HÀM: Gửi email thông báo cho supervisor khi user kích hoạt thành công
const sendActivationNotificationToSupervisor = async (
  supervisorEmail,
  userEmail,
  userName,
  role,
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: supervisorEmail,
      subject: `✅ Người dùng ${userEmail} đã kích hoạt tài khoản thành công`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2196F3, #1976D2); padding: 25px; border-radius: 10px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0;">👨‍💼 Thông báo kích hoạt tài khoản</h2>
            <p style="margin: 10px 0 0 0;">Người dùng đã kích hoạt tài khoản thành công</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Thông tin người dùng</h3>
            <p><strong>📧 Email:</strong> ${userEmail}</p>
            <p><strong>👤 Tên:</strong> ${userName || 'Chưa cập nhật'}</p>
            <p><strong>👔 Vai trò:</strong> ${role}</p>
            <p><strong>⏰ Thời gian kích hoạt:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          
          <p style="color: #666;">Người dùng hiện có thể đăng nhập và sử dụng hệ thống với vai trò được phân quyền.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Activation notification sent to supervisor:', supervisorEmail);
  } catch (error) {
    console.error('❌ Error sending supervisor notification:', error);
    // Không throw error để không ảnh hưởng đến quá trình kích hoạt chính
  }
};

module.exports = {
  sendOTPEmail,
  sendResetPasswordEmail,
  sendPasswordResetConfirmation,
  sendActivationEmail,
  sendAccountActivatedNotification,
  sendActivationNotificationToSupervisor,
};
