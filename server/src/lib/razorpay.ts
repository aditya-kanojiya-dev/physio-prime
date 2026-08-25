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

export async function createRefund(params: { paymentId: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/payments/${params.paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status} ${await res.text()}`);
}

export function verifyWebhookSignature(params: { rawBody: string; signature: string }): boolean {
  const expected = createHmac('sha256', getConfig().RAZORPAY_WEBHOOK_SECRET).update(params.rawBody).digest();
  const provided = Buffer.from(params.signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
