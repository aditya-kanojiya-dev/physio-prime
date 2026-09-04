import { and, eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '../db/pool';
import { appointments, doctors, notifications, users } from '../db/schema';
import { getConfig } from '../config';

function isNotOnWhatsApp(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not.*whatsapp|invalid.*to.*number|channel.*unavailable/i.test(msg);
}

// ponytail: 10s hard timeout so a hung provider can never stall the booking response
const FETCH_TIMEOUT_MS = 10_000;

async function sendTwilioMessage(params: { to: string; body: string; whatsapp: boolean }): Promise<void> {
  const config = getConfig();
  const accountSid = config.TWILIO_ACCOUNT_SID;
  const authToken = config.TWILIO_AUTH_TOKEN;
  const from = params.whatsapp
    ? config.TWILIO_WHATSAPP_FROM
    : config.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    // ponytail: Twilio not configured — skip silently, notifications are best-effort
    return;
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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

// Smartping (Satzilio) single SMS via POST /api/v1/message (Basic auth, JSON body).
// ponytail: best-effort — returns false when unconfigured so callers can tell the user SMS didn't go out.
export async function sendSmartpingSms(params: { to: string; text: string }): Promise<boolean> {
  const cfg = getConfig();
  const api = cfg.SMARTPING_API_BASE;
  const user = cfg.SMARTPING_API_USER;
  const password = cfg.SMARTPING_API_PASSWORD;
  const sender = cfg.SMARTPING_SENDER;
  if (!api || !user || !password || !sender) return false;
  const extra: Record<string, string> = {};
  if (cfg.SMARTPING_PE_ID) extra.dltPrincipalEntityId = cfg.SMARTPING_PE_ID;
  if (cfg.SMARTPING_HEADER_ID) extra.dltContentId = cfg.SMARTPING_HEADER_ID;
  const res = await fetch(`${api}/api/v1/message`, {
    method: 'POST',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ unicode: false, sender, message: { recipient: params.to, text: params.text }, extra }),
  });
  if (!res.ok) throw new Error(`Smartping failed: ${res.status} ${await res.text()}`);
  return true;
}

// Module-level dispatch so tests can vi.mock. sendNotification catches provider
// errors itself (marks the row failed) — callers must never need a try/catch.
export const providers = {
  async twilioWhatsApp(params: { to: string; body: string }): Promise<void> {
    await sendTwilioMessage({ ...params, whatsapp: true });
  },
  async twilioSms(params: { to: string; body: string }): Promise<void> {
    await sendTwilioMessage({ ...params, whatsapp: false });
  },
  async resendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    const config = getConfig();
    const apiKey = config.RESEND_API_KEY;
    const from = config.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return; // ponytail: skip silently when unconfigured
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
    if (error) throw new Error(`Resend failed: ${error.message}`);
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
      `(Booking ${ctx.bookingId}) has been cancelled.${ctx.refunded ? ' Your payment has been refunded.' : ' As per our Terms, the payment is non-refundable.'}`,
  }),
  appointmentReminder: (ctx: NotificationCtx) => ({
    subject: `Reminder: appointment with ${ctx.doctorName} tomorrow`,
    body:
      `Reminder ${ctx.patientName}: your ${ctx.mode} appointment with ${ctx.doctorName} is tomorrow (${ctx.date}) at ${ctx.timeSlot} ` +
      `(Booking ${ctx.bookingId}).`,
  }),
};

export async function dispatch(notification: {
  channel: string;
  toAddress: string;
  subject: string | null;
  body: string | null;
}): Promise<void> {
  const body = notification.body ?? '';
  switch (notification.channel) {
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
    case 'email':
      await providers.resendEmail({
        to: notification.toAddress,
        subject: notification.subject ?? '',
        html: body,
      });
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
  let row;
  try {
    const [inserted] = await db
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
    row = inserted;
  } catch {
    // ponytail: even the insert must not reach the booking flow
    return;
  }
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
    try {
      await db.update(notifications).set({ status: 'failed', error: message }).where(eq(notifications.id, row.id));
    } catch {
      // ponytail: recording the failure is best-effort too
    }
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
      patientEmail: users.email,
      doctorName: doctors.name,
      mode: appointments.mode,
      date: appointments.date,
      timeSlot: appointments.timeSlot,
      bookingId: appointments.bookingId,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(users.id, appointments.patientId))
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
    // Email is the reliable channel (Twilio is unconfigured); whatsapp as fallback.
    if (apt.patientEmail) {
      await sendNotification({
        userId: apt.patientId,
        appointmentId: apt.id,
        channel: 'email',
        to: apt.patientEmail,
        subject: tpl.subject,
        body: tpl.body,
        template: 'reminder',
      });
      sent++;
    } else if (apt.patientPhone) {
      await sendNotification({
        userId: apt.patientId,
        appointmentId: apt.id,
        channel: 'whatsapp',
        to: apt.patientPhone,
        subject: tpl.subject,
        body: tpl.body,
        template: 'reminder',
      });
      sent++;
    }
  }
  return sent;
}

