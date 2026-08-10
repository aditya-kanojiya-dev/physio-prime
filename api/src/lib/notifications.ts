import { and, eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments, doctors, notifications } from '../db/schema';

// Providers are read lazily from env at call time (mirroring lib/razorpay.ts):
// the API boots and all tests run with empty provider keys in .env, so these
// are intentionally NOT in the required getConfig() schema.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function isNotOnWhatsApp(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not.*whatsapp|invalid.*to.*number|channel.*unavailable/i.test(msg);
}

async function sendResendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: requireEnv('RESEND_FROM_EMAIL'),
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

async function sendTwilioMessage(params: { to: string; body: string; whatsapp: boolean }): Promise<void> {
  const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const from = params.whatsapp
    ? requireEnv('TWILIO_WHATSAPP_FROM')
    : requireEnv('TWILIO_FROM_NUMBER');
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: params.to,
        From: from,
        Body: params.body,
      }),
    },
  );
  if (!res.ok) throw new Error(`Twilio failed: ${res.status} ${await res.text()}`);
}

// Module-level dispatch so tests can vi.mock. sendNotification catches provider
// errors itself (marks the row failed) — callers must never need a try/catch.
export const providers = {
  async resend(params: { to: string; subject: string; html: string }): Promise<void> {
    await sendResendEmail(params);
  },
  async twilioWhatsApp(params: { to: string; body: string }): Promise<void> {
    await sendTwilioMessage({ ...params, whatsapp: true });
  },
  async twilioSms(params: { to: string; body: string }): Promise<void> {
    await sendTwilioMessage({ ...params, whatsapp: false });
  },
};

export interface NotificationCtx {
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  mode: string;
  bookingId: string;
}

export const templates = {
  bookingConfirmed: (ctx: NotificationCtx & { amountPaise?: number }) => ({
    subject: `Appointment confirmed — ${ctx.doctorName}`,
    body:
      `Hi ${ctx.patientName}, your ${ctx.mode} appointment with ${ctx.doctorName} on ${ctx.date} at ${ctx.timeSlot} ` +
      `(Booking ${ctx.bookingId}) is confirmed.${ctx.amountPaise != null ? ` Payment received: ₹${(ctx.amountPaise / 100).toFixed(2)}.` : ''} ` +
      'Need help? Reply to this message.',
  }),
  bookingRescheduled: (ctx: NotificationCtx) => ({
    subject: `Appointment rescheduled — ${ctx.doctorName}`,
    body:
      `Hi ${ctx.patientName}, your ${ctx.mode} appointment with ${ctx.doctorName} was moved to ${ctx.date} at ${ctx.timeSlot} ` +
      `(Booking ${ctx.bookingId}).`,
  }),
  bookingCancelled: (ctx: NotificationCtx & { refunded?: boolean }) => ({
    subject: `Appointment cancelled — ${ctx.doctorName}`,
    body:
      `Hi ${ctx.patientName}, your ${ctx.mode} appointment with ${ctx.doctorName} on ${ctx.date} at ${ctx.timeSlot} ` +
      `(Booking ${ctx.bookingId}) has been cancelled.${ctx.refunded ? ' Your payment has been refunded.' : ''}`,
  }),
  appointmentReminder: (ctx: NotificationCtx) => ({
    subject: `Reminder: appointment with ${ctx.doctorName} tomorrow`,
    body:
      `Reminder ${ctx.patientName}: your ${ctx.mode} appointment with ${ctx.doctorName} is tomorrow (${ctx.date}) at ${ctx.timeSlot} ` +
      `(Booking ${ctx.bookingId}).`,
  }),
};

function htmlify(subject: string, body: string): string {
  const safe = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div style="font-family:sans-serif"><h2>${subject}</h2><p>${safe}</p></div>`;
}

export async function dispatch(notification: {
  channel: string;
  toAddress: string;
  subject: string | null;
  body: string | null;
}): Promise<void> {
  const subject = notification.subject ?? '';
  const body = notification.body ?? '';
  switch (notification.channel) {
    case 'email':
      await providers.resend({ to: notification.toAddress, subject, html: htmlify(subject, body) });
      return;
    case 'whatsapp':
      try {
        await providers.twilioWhatsApp({ to: notification.toAddress, body });
      } catch (err) {
        if (isNotOnWhatsApp(err)) {
          await providers.twilioSms({ to: notification.toAddress, body });
          return;
        }
        throw err;
      }
      return;
    case 'sms':
      await providers.twilioSms({ to: notification.toAddress, body });
      return;
    default:
      throw new Error(`Unknown notification channel: ${notification.channel}`);
  }
}

export async function sendNotification(params: {
  userId?: number;
  appointmentId?: number;
  channel: string;
  to: string;
  subject?: string;
  body?: string;
  template?: string;
}): Promise<void> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId ?? null,
      appointmentId: params.appointmentId ?? null,
      channel: params.channel,
      toAddress: params.to,
      subject: params.subject ?? null,
      body: params.body ?? null,
      template: params.template ?? null,
      status: 'queued',
    })
    .returning();
  try {
    await dispatch({
      channel: row.channel,
      toAddress: row.toAddress,
      subject: row.subject,
      body: row.body,
    });
    await db.update(notifications).set({ status: 'sent', sentAt: new Date() }).where(eq(notifications.id, row.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.update(notifications).set({ status: 'failed', error: message }).where(eq(notifications.id, row.id));
  }
}

// ponytail: naive local dates, single-clinic assumption
export async function sendReminderPass(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const due = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      doctorName: doctors.name,
      mode: appointments.mode,
      date: appointments.date,
      timeSlot: appointments.timeSlot,
      bookingId: appointments.bookingId,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(and(eq(appointments.date, tomorrowStr), eq(appointments.status, 'upcoming'), eq(appointments.paymentStatus, 'paid')));

  let sent = 0;
  for (const apt of due) {
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.appointmentId, apt.id), eq(notifications.template, 'reminder')));
    if (existing) continue;
    const tpl = templates.appointmentReminder({
      patientName: apt.patientName,
      doctorName: apt.doctorName ?? 'your physiotherapist',
      date: apt.date,
      timeSlot: apt.timeSlot,
      mode: apt.mode,
      bookingId: apt.bookingId,
    });
    await sendNotification({
      userId: apt.patientId,
      appointmentId: apt.id,
      channel: apt.patientPhone ? 'whatsapp' : 'email',
      to: apt.patientPhone ?? '',
      subject: tpl.subject,
      body: tpl.body,
      template: 'reminder',
    });
    sent++;
  }
  return sent;
}

