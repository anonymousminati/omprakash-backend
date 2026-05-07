import express from 'express';
import { handleResendWebhook } from '../controllers/webhook.controller';

const router = express.Router();

// The webhook needs the raw body for Svix signature verification
router.post('/resend', express.raw({ type: 'application/json' }), handleResendWebhook);

export default router;
