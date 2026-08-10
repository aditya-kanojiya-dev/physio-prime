import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = 'https://api.razorpay.com/v1';

// Keys are read lazily from env at call time: the API must boot (and all tests
// run) with empty RAZORPAY_* vars in .env, so these are intentionally NOT in the
// required getConfig() schema.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Razorpay ${name} is not configured`);
  return value;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${requireEnv('RAZORPAY_KEY_ID')}:${requireEnv('RAZORPAY_KEY_SECRET')}`).toString('base64')}`;
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
  const expected = createHmac('sha256', requireEnv('RAZORPAY_KEY_SECRET'))
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
  const expected = createHmac('sha256', requireEnv('RAZORPAY_WEBHOOK_SECRET')).update(params.rawBody).digest();
  const provided = Buffer.from(params.signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
