import { createHmac, timingSafeEqual } from 'node:crypto';
import { getConfig } from '../config';

const BASE_URL = 'https://api.razorpay.com/v1';

function authHeader(): string {
  const config = getConfig();
  return `Basic ${Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64')}`;
}

export interface RazorpayOrder {
  id: string;
  amountPaise: number;
}

export async function createOrder(params: { amountPaise: number; receipt: string }): Promise<RazorpayOrder> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: params.amountPaise, currency: 'INR', receipt: params.receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string; amount: number };
  return { id: data.id, amountPaise: data.amount };
}

export function verifySignature(params: { orderId: string; paymentId: string; signature: string }): boolean {
  const expected = createHmac('sha256', getConfig().RAZORPAY_KEY_SECRET)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest();
  const provided = Buffer.from(params.signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function createRefund(params: { paymentId: string; amountPaise?: number }): Promise<void> {
  const res = await fetch(`${BASE_URL}/payments/${params.paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: params.amountPaise != null ? JSON.stringify({ amount: params.amountPaise }) : undefined,
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status} ${await res.text()}`);
}

export interface UpiQrCode {
  id: string;
  image: string;
  shortUrl: string | null;
  closeBy: number | null;
}

// Single-use fixed-amount UPI QR for clinic postpay collection (₹ minutes → 2h expiry).
export async function createUpiQrCode(params: { amountPaise: number; idempotencyKey: string }): Promise<UpiQrCode> {
  const res = await fetch(`${BASE_URL}/payments/qr_codes`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'upi_qr',
      name: params.idempotencyKey,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: params.amountPaise,
      description: `PhysioPrime appointment ${params.idempotencyKey}`,
      close_by: Math.floor(Date.now() / 1000) + 2 * 3600,
    }),
  });
  if (!res.ok) throw new Error(`Razorpay QR code creation failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    id: string;
    image_content?: string;
    qr_code?: string;
    image_url?: string;
    short_url?: string;
    close_by?: number | null;
  };
  return {
    id: data.id,
    image: data.image_content ?? data.qr_code ?? data.image_url ?? '',
    shortUrl: data.short_url ?? null,
    closeBy: data.close_by ?? null,
  };
}

export function verifyWebhookSignature(params: { rawBody: string; signature: string }): boolean {
  const expected = createHmac('sha256', getConfig().RAZORPAY_WEBHOOK_SECRET).update(params.rawBody).digest();
  const provided = Buffer.from(params.signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
