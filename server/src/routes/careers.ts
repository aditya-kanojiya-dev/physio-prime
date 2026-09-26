import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { db } from '../db/pool';
import { doctorApplications } from '../db/schema';
import { notifyAdmin, sendNotification } from '../lib/notifications';

export const careersRouter = Router();

// ponytail: tight per-route limiter — 5 submissions per 15 min per IP
careersRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { message: 'Too many applications. Please try again later.' } });
    },
  }),
);

const careerSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z
    .string()
    .refine((v) => !v || /^\d{10}$/.test(v), 'phone must be exactly 10 digits')
    .optional(),
  position: z.string().max(200).optional(),
  specialization: z.array(z.string()).optional(),
  qualification: z.string().max(200).optional(),
  experience: z.string().max(100).optional(),
  currentOrganization: z.string().max(300).optional(),
  certifications: z.string().max(500).optional(),
  coverLetter: z.string().max(5000).optional(),
  joiningDate: z.string().max(100).optional(),
  consent: z.boolean(),
  resumeUrl: z.string().url().max(1000).optional(),
  supportingDocType: z.string().min(1).max(100),
  supportingDocUrl: z.string().url().max(1000),
  photoUrl: z.string().url().max(1000).optional(),
  doctorCertificateUrl: z.string().url().max(1000),
});

careersRouter.post('/', async (req, res, next) => {
  try {
    const body = careerSchema.parse(req.body);
    if (!body.consent) {
      res.status(400).json({ error: { message: 'Consent is required' } });
      return;
    }

    const [application] = await db
      .insert(doctorApplications)
      .values({
        candidateName: body.fullName,
        candidateEmail: body.email,
        phone: body.phone ?? null,
        position: body.position ?? null,
        specializations: body.specialization ?? [],
        qualification: body.qualification ?? null,
        experience: body.experience ?? null,
        currentOrganization: body.currentOrganization ?? null,
        certifications: body.certifications ?? null,
        resumeUrl: body.resumeUrl ?? null,
        photoUrl: body.photoUrl ?? null,
        coverLetter: body.coverLetter ?? null,
        joiningDate: body.joiningDate ?? null,
        documentType: body.supportingDocType,
        documentUrl: body.supportingDocUrl,
        doctorCertificateUrl: body.doctorCertificateUrl,
        consent: true,
      })
      .returning();

    // admin alert — best-effort, awaited so the serverless function doesn't
    // freeze mid-dispatch (same lesson as the confirmation email)
    try {
      await notifyAdmin({
        type: 'doctor_application',
        title: `New ${body.position ?? 'doctor'} application`,
        body: `${body.fullName} (${body.email})${body.phone ? ` ${body.phone}` : ''}${body.qualification ? ` — ${body.qualification}` : ''}${body.experience ? `, ${body.experience} experience` : ''}`,
        link: '/admin/doctors',
        metadata: { applicationId: application.id, name: body.fullName, email: body.email },
      });
    } catch {
      // ponytail: best-effort
    }

    // confirmation email — best-effort, don't fail the submission.
    // awaited so the serverless function doesn't freeze mid-dispatch.
    try {
      await sendNotification({
        channel: 'email',
        to: body.email,
        subject: 'Application received — PhysioPrime',
        body:
          `<p>Hi ${body.fullName},</p>` +
          `<p>Thank you for applying to PhysioPrime. We have received your application for the <strong>${body.position ?? 'open position'}</strong> role.</p>` +
          `<p>Our HR team will review your application and get back to you within 48 hours.</p>` +
          `<p>Best regards,<br/>PhysioPrime Team</p>`,
      });
    } catch {
      // ponytail: best-effort
    }

    res.status(201).json({ application: { id: application.id, status: application.status } });
  } catch (err) {
    next(err);
  }
});
