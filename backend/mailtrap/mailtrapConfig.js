import { MailtrapClient } from 'mailtrap';
import dotenv from 'dotenv';
dotenv.config();

const mailtrapClient = new MailtrapClient({
    endpoint: process.env.MAILTRAP_ENDPOINT,
    token: process.env.MAILTRAP_TOKEN,
});

const sender = {
    email: process.env.MAIL_SENDER_EMAIL || 'noreply@yourdomain.com',
    name: process.env.MAIL_SENDER_NAME || 'Your App Name',
};

module.exports = { mailtrapClient, sender };