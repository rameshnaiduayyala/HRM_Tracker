import nodemailer from 'nodemailer';
import EventEmitter from 'events';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

// Read SMTP configuration from environment variables
const smtpHost = process.env.SMTP_HOST || 'localhost';
const smtpPort = Number(process.env.SMTP_PORT || 25);
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const mailFromName = process.env.MAIL_FROM_NAME || 'FocusTrack Enterprise';
const mailFromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@focustrack.com';

// Create Nodemailer Transporter
export const mailTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // false for Papercut SMTP (port 25)
  auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  tls: {
    rejectUnauthorized: false, // For local development tools like Papercut
  },
});

/**
 * Direct SMTP mail delivery (blocking)
 */
export async function sendEmailDirect(options: SendMailOptions): Promise<boolean> {
  try {
    const info = await mailTransporter.sendMail({
      from: `"${mailFromName}" <${mailFromAddress}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      attachments: options.attachments,
    });

    console.log(`[Email Broker] Delivered to ${options.to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('[Email Broker Error]', error);
    return false;
  }
}

// In-Memory Asynchronous Mail Event Broker (Non-blocking queue execution)
class MailBrokerEmitter extends EventEmitter {}
const mailBroker = new MailBrokerEmitter();

// Attach async background worker to process dispatched mail events
mailBroker.on('send_mail', (options: SendMailOptions) => {
  setImmediate(async () => {
    await sendEmailDirect(options);
  });
});

/**
 * Non-blocking email dispatch function.
 * Returns immediately without delaying HTTP API response times.
 */
export function sendEmail(options: SendMailOptions): void {
  mailBroker.emit('send_mail', options);
}
