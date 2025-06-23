import { sendEmail } from '../services/mailtrapService';

sendEmail({
  to: 'recipient@email.com',
  subject: 'Test Mailtrap SDK',
  text: 'Đây là email test gửi từ Mailtrap SDK!',
});

module.exports = {};
