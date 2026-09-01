import { Router, type NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments, doctors, paymentWebhooks } from '../db/schema';
import { computeCommission } from '../lib/commission';
import { recordPaymentTransaction, type Tx } from '../lib/payments';
import { verifyWebhookSignature } from '../lib/razorpay';

export const razorpayRouter = Router();

interface PaymentEntity {
  id?: string;
  order_id?: string;
  qr_id?: string;
  amount?: number;
  status?: string;
  method?: string;
  notes?: { [k: string]: unknown };
}

// Mark a captured payment as paid + record the commission ledger, either for a
// prepay appointment (matched by razorpay order) or a postpay UPI appointment
// (matched by the QR id). Shared by both webhook branches.
async function recordCaptured(
  tx: Tx,
  payment: PaymentEntity,
  opts: { orderId?: string; qrId?: string; transactionType: 'patient_prepay' | 'patient_postpay_upi' },
): Promise<void> {
  const where = opts.orderId ? eq(appointments.razorpayOrderId, opts.orderId) : eq(appointments.razorpayQrId, opts.qrId!);
  const [row] = await tx
    .select({
      id: appointments.id,
      doctorId: appointments.doctorId,
      patientId: appointments.patientId,
      feePaise: appointments.feePaise,
      paymentStatus: appointments.paymentStatus,
      platformFeePercent: doctors.platformFeePercent,
    })
    .from(appointments)
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .where(where)
    .for('update');
  if (!row || row.paymentStatus === 'paid') return;
  const c = computeCommission(row.feePaise, row.platformFeePercent);
  await tx
    .update(appointments)
    .set({
      paymentStatus: 'paid',
      paymentMethod: opts.transactionType === 'patient_postpay_upi' ? 'upi' : payment.method ?? null,
      razorpayPaymentId: payment.id,
    })
    .where(eq(appointments.id, row.id));
  await recordPaymentTransaction(tx, {
    appointmentId: row.id,
    patientId: row.patientId,
    doctorId: row.doctorId,
    transactionType: opts.transactionType,
    status: 'captured',
    amountPaise: row.feePaise,
    platformFeePaise: c.platformFeePaise,
    doctorEarningsPaise: c.doctorEarningsPaise,
    netAmountPaise: c.doctorEarningsPaise,
    gateway: 'razorpay',
    gatewayOrderId: opts.orderId ?? null,
    gatewayPaymentId: payment.id,
    paymentMethod: opts.transactionType === 'patient_postpay_upi' ? 'upi' : payment.method ?? null,
    createdBy: null,
    metadata: { qrId: opts.qrId ?? null },
  });
}

// Public endpoint. The raw body is parsed before the global express.json() (see
// index.ts) so the razorpay signature can be verified against the exact bytes.
// Idempotent: a replayed event (same event + payment id) is acknowledged without
// re-applying side effects, and every received event is persisted for audit.
razorpayRouter.post('/webhook', async (req, res, next: NextFunction) => {
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

  const event = payload.event;
  const payment = payload.payload?.payment?.entity;
  if (!event || !payment?.id) {
    res.json({ received: true, skipped: 'unknown event or no payment id' });
    return;
  }
  const eventId = `${event}:${payment.id}`;

  try {
    await db.transaction(async (tx) => {
      const seen = await tx
        .select({ processed: paymentWebhooks.processed })
        .from(paymentWebhooks)
        .where(eq(paymentWebhooks.eventId, eventId))
        .for('update');
      // Already processed (or currently processing) — acknowledge without side effects.
      if (seen.length > 0) return;

      await tx.insert(paymentWebhooks).values({
        event,
        eventId,
        paymentId: payment.id,
        orderId: payment.order_id ?? null,
        entity: payload.payload?.payment?.entity as object,
      });

      if (event === 'payment.captured') {
        if (payment.order_id) {
          await recordCaptured(tx, payment, { orderId: payment.order_id, transactionType: 'patient_prepay' });
        } else if (payment.qr_id) {
          await recordCaptured(tx, payment, { qrId: payment.qr_id, transactionType: 'patient_postpay_upi' });
        }
      } else if (event === 'payment.failed' && payment.order_id) {
        await tx
          .update(appointments)
          .set({ paymentStatus: 'failed' })
          .where(eq(appointments.razorpayOrderId, payment.order_id));
      }

      await tx.update(paymentWebhooks).set({ processed: true, processedAt: new Date() }).where(eq(paymentWebhooks.eventId, eventId));
    });
  } catch (err) {
    next(err);
    return;
  }
  res.json({ received: true });
});
