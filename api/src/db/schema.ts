import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  time,
  boolean,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const patientProfiles = pgTable('patient_profiles', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  gender: text('gender'),
  dob: date('dob'),
  weight: numeric('weight'),
  height: numeric('height'),
  address: jsonb('address').notNull().default({}),
});

export const doctorApplications = pgTable('doctor_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  status: text('status').notNull().default('pending'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  notes: text('notes'),
});

export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  name: text('name').notNull(),
  title: text('title'),
  specialty: text('specialty'),
  slug: text('slug').notNull().unique(),
  photo: text('photo'),
  rating: numeric('rating').notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  experienceYears: integer('experience_years'),
  patientsTreated: integer('patients_treated'),
  languages: text('languages').array().notNull().default([]),
  location: jsonb('location').notNull().default({}),
  fees: jsonb('fees').notNull().default({}),
  nextAvailable: date('next_available'),
  verified: boolean('verified').notNull().default(false),
  featured: boolean('featured').notNull().default(false),
  gender: text('gender'),
  bio: text('bio'),
  education: jsonb('education').notNull().default([]),
  experience: jsonb('experience').notNull().default([]),
  registration: jsonb('registration').notNull().default({}),
  expertise: text('expertise').array().notNull().default([]),
  treatments: text('treatments').array().notNull().default([]),
});

export const doctorSchedules = pgTable(
  'doctor_schedules',
  {
    id: serial('id').primaryKey(),
    doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    breakStart: time('break_start'),
    breakEnd: time('break_end'),
    active: boolean('active').notNull().default(true),
  },
  (t) => [unique().on(t.doctorId, t.dayOfWeek)],
);

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  bookingId: text('booking_id').notNull().unique(),
  patientId: integer('patient_id').notNull().references(() => users.id),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id),
  mode: text('mode').notNull(),
  date: date('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  status: text('status').notNull().default('upcoming'),
  symptom: text('symptom'),
  feePaise: integer('fee_paise').notNull(),
  address: jsonb('address').notNull().default({}),
  paymentStatus: text('payment_status').notNull().default('pending'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  videoCallLink: text('video_call_link'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id').notNull().unique().references(() => appointments.id),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  color: text('color'),
  conditions: jsonb('conditions').notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const symptoms = pgTable('symptoms', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  iconName: text('icon_name'),
  description: text('description'),
  popularFor: jsonb('popular_for').notNull().default({}),
  recoveryEstimate: text('recovery_estimate'),
  image: text('image'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const contentSections = pgTable(
  'content_sections',
  {
    id: serial('id').primaryKey(),
    page: text('page').notNull(),
    key: text('key').notNull(),
    data: jsonb('data').notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [unique().on(t.page, t.key)],
);

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  channel: text('channel').notNull(),
  toAddress: text('to_address').notNull(),
  subject: text('subject'),
  body: text('body'),
  status: text('status').notNull().default('queued'),
  providerId: text('provider_id'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});
