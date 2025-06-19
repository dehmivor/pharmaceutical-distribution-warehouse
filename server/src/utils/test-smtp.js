const nodemailer = require('nodemailer');

async function testConnection() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'tamntmhe172274@fpt.edu.vn',
      pass: 'nsqs gwoo fgkk vxla',
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (error) {
    console.log('❌ SMTP connection failed:', error);
  }
}

testConnection();
module.exports = { testConnection };
