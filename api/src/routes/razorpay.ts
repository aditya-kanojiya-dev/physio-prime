import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments } from '../db/schema';
import { verifyWebhookSignature } from '../lib/razorpay';

export const razorpayRouter = Router();

interface PaymentEntity {
  id?: string;
  order_id?: string;
}

// Public endpoint. The raw body is parsed before the global express.json() (see
// index.ts) so the razorpay signature can be verified against the exact bytes.
razorpayRouter.post('/webhook', async (req, res) => {
  const header = req.headers['x-razorpay-signature'];
  const signature = Array.isArray(header) ? header[0] : header;
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : null;
  if (!signature || !raw) {
    res.status(401).json({ error: { message: 'Missing signature or body' } });
    return;
  }

  let payload: { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    if (!verifyWebhookSignature({ rawBody: raw, signature })) {
      res.status(401).json({ error: { message: 'Invalid signature' } });
      return;
    }
    payload = JSON.parse(raw);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: { message: 'Invalid JSON body' } });
      return;
    }
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Webhook verification failed' } });
    return;
  }

  const payment = payload.payload?.payment?.entity;
  if (payload.event === 'payment.captured' && payment?.order_id && payment.id) {
    await db
      .update(appointments)
      .set({ paymentStatus: 'paid', razorpayPaymentId: payment.id })
      .where(eq(appointments.razorpayOrderId, payment.order_id));
  } else if (payload.event === 'payment.failed' && payment?.order_id) {
    await db
      .update(appointments)
      .set({ paymentStatus: 'failed' })
      .where(eq(appointments.razorpayOrderId, payment.order_id));
  }
  res.json({ received: true });
});
