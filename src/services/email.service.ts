import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '../config/env';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;

  private constructor() {
    this.resend = new Resend(RESEND_API_KEY || '');
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail({ to, subject, html, react }: { to: string | string[], subject: string, html?: string, react?: any }) {
    try {
      const fromEmail = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      const payload: any = {
        from: fromEmail,
        to,
        subject,
      };
      if (html) payload.html = html;
      if (react) payload.react = react;

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        logger.error('Resend API Error:', error);
        throw new Error(`Email failed: ${error.message}`);
      }

      logger.info(`Email sent successfully to ${to}`);
      return data;
    } catch (err) {
      logger.error('Email Service Exception:', err);
      throw err;
    }
  }
}

export const emailService = EmailService.getInstance();
