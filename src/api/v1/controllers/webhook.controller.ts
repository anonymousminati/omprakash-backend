import { Request, Response } from 'express';
import { Webhook } from 'svix';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

// Use a fallback secret for local dev if not provided
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || 'whsec_local_fallback';

export const handleResendWebhook = async (req: Request, res: Response) => {
  try {
    const payloadString = req.body.toString();
    const svixHeaders = req.headers as any;

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payloadString, svixHeaders) as any;

    const { type, data } = evt;

    logger.info(`Received Resend Webhook Event: ${type}`);

    switch (type) {
      case 'email.sent':
        logger.info(`Email sent: ${data.email_id}`);
        break;
      case 'email.delivered':
        logger.info(`Email delivered: ${data.email_id}`);
        break;
      case 'email.bounced':
        logger.warn(`Email bounced: ${data.email_id} for ${data.to}`);
        // Handle bounce (e.g., mark user as unsubscribed)
        break;
      case 'email.complained':
        logger.warn(`Email complained: ${data.email_id} for ${data.to}`);
        // Handle complaint
        break;
      default:
        logger.info(`Unhandled Resend Webhook Event type: ${type}`);
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    logger.error('Resend Webhook Error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
