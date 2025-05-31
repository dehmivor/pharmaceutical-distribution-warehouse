import { MailtrapClient } from 'mailtrap';
import dotenv from 'dotenv';

dotenv.config();

const API_TOKEN = process.env.MAILTRAP_API_TOKEN;
if (!API_TOKEN) throw new Error('Missing Mailtrap API token in .env file');

const client = new MailtrapClient({ token: API_TOKEN });

export const sendEmail = async ({ to, subject, text, html }) => {
  await client.send({
    from: { email: 'minhtamnghp03@gmail.com', name: 'Nguyễn Minh Tâm' },
    to: [{ email: to }],
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    category: 'test',
  });
  console.log('Email sent successfully');
};
