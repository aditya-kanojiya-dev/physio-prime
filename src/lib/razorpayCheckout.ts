import { api } from './api';

let loadPromise: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.body.appendChild(script);
    });
  }
  return loadPromise;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface RazorpayCheckoutOptions {
  appointmentId: string;
  orderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; email?: string; contact: string };
  onPaid: () => void;
  onDismiss?: () => void;
}

// Opens the Razorpay window for an existing order (created at booking time).
// On payment the backend /verify marks the appointment paid; onPaid runs even
// if that call fails since the webhook reconciles it later.
export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key || !opts.orderId) throw new Error('Payment gateway is not configured.');
  await loadRazorpay();
  const rzp = new window.Razorpay!({
    key,
    order_id: opts.orderId,
    amount: opts.amountPaise,
    currency: 'INR',
    name: 'PhysioPrime',
    description: opts.description,
    prefill: opts.prefill,
    handler: async (response: Record<string, string>) => {
      try {
        await api.post(`/appointments/${opts.appointmentId}/verify`, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      } catch {
        // ponytail: verification failed but payment went through; webhook reconciles
      }
      opts.onPaid();
    },
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });
  rzp.open();
}