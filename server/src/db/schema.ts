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
  primaryKey,
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
  homeVisitsEnabled: boolean('home_visits_enabled').notNull().default(false),
  maxRadiusKm: numeric('max_radius_km').notNull().default('10'),
  phone: text('phone'),
  designation: text('designation'),
  employeeId: text('employee_id'),
  department: text('department'),
  address: jsonb('address').notNull().default({}),
  platformFeePercent: integer('platform_fee_percent').notNull().default(30),
});

export const doctorSchedules = pgTable(
  'doctor_schedules',
  {
    id: serial('id').primaryKey(),
    doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    windowStart: time('window_start').notNull(),
    windowEnd: time('window_end').notNull(),
    maxPatients: integer('max_patients').notNull().default(3),
    active: boolean('active').notNull().default(true),
  },
  (t) => [unique().on(t.doctorId, t.dayOfWeek, t.windowStart)],
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
  paymentMode: text('payment_mode').notNull().default('prepay'), // prepay | postpay
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentMethod: text('payment_method'), // upi | card | netbanking | cash
  paymentCollectedByDoctorId: integer('payment_collected_by_doctor_id').references(() => doctors.id),
  cashCollectedAt: timestamp('cash_collected_at', { withTimezone: true }),
  sessionStartedAt: timestamp('session_started_at', { withTimezone: true }),
  sessionCompletedAt: timestamp('session_completed_at', { withTimezone: true }),
  sessionDurationSec: integer('session_duration_sec'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpayQrId: text('razorpay_qr_id'),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  patientEmail: text('patient_email'),
  patientGender: text('patient_gender'),
  patientAge: integer('patient_age'),
  patientWeight: numeric('patient_weight'),
  patientHeight: numeric('patient_height'),
  patientRelation: text('patient_relation'),
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
  featured: boolean('featured').notNull().default(false),
  status: text('status').notNull().default('approved'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const prescriptions = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id').notNull().unique().references(() => appointments.id),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id),
  patientId: integer('patient_id').notNull().references(() => users.id),
  diagnosis: text('diagnosis'),
  medicines: jsonb('medicines').notNull().default([]),
  advice: text('advice'),
  followUpDate: date('follow_up_date'),
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
  symptomsList: text('symptoms_list'),
  treatment: text('treatment'),
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
  appointmentId: integer('appointment_id').references(() => appointments.id),
  channel: text('channel').notNull(),
  toAddress: text('to_address').notNull(),
  subject: text('subject'),
  body: text('body'),
  template: text('template'),
  status: text('status').notNull().default('queued'),
  providerId: text('provider_id'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

export const doctorLocations = pgTable('doctor_locations', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address'),
  area: text('area'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  lat: numeric('lat'),
  lng: numeric('lng'),
  radiusKm: numeric('radius_km').notNull().default('10'),
  isPrimary: boolean('is_primary').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const doctorPayouts = pgTable('doctor_payouts', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  amountPaise: integer('amount_paise').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

export const communityCategories = pgTable('community_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => communityCategories.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  tags: text('tags').array().notNull().default([]),
  replyCount: integer('reply_count').notNull().default(0),
  voteCount: integer('vote_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  pinned: boolean('pinned').notNull().default(false),
  closed: boolean('closed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityReplies = pgTable('community_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'),
  body: text('body').notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityVotes = pgTable('community_votes', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  postId: integer('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  replyId: integer('reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.doctorId, t.postId), unique().on(t.doctorId, t.replyId)]);

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  doctor1Id: integer('doctor1_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  doctor2Id: integer('doctor2_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessage: text('last_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.doctor1Id, t.doctor2Id)]);

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const doctorNotifications = pgTable('doctor_notifications', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'),
  read: boolean('read').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Blog ---
export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogTags = pgTable('blog_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  featuredImage: text('featured_image'),
  status: text('status').notNull().default('draft'), // 'draft' | 'published'
  authorType: text('author_type').notNull().default('admin'), // 'admin' | 'doctor'
  authorId: integer('author_id').notNull(), // references admins.id or doctors.id
  categoryId: integer('category_id').references(() => blogCategories.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogPostTags = pgTable(
  'blog_post_tags',
  {
    postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

// --- payments -----------------------------------------------------------

// Immutable ledger of every money movement. Single source of truth for money.
// Never updated in place; corrections are new rows (transactionType 'adjustment').
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  transactionId: text('transaction_id').notNull().unique(),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  patientId: integer('patient_id').references(() => users.id),
  doctorId: integer('doctor_id').references(() => doctors.id),
  transactionType: text('transaction_type').notNull(), // patient_prepay | patient_postpay_upi | patient_postpay_cash | doctor_cash_remittance | refund | adjustment | cancellation_refund
  status: text('status').notNull().default('pending'), // pending | authorized | captured | completed | failed | refunded | voided
  amountPaise: integer('amount_paise').notNull().default(0),
  platformFeePaise: integer('platform_fee_paise').notNull().default(0),
  doctorEarningsPaise: integer('doctor_earnings_paise').notNull().default(0),
  gatewayFeePaise: integer('gateway_fee_paise').notNull().default(0),
  netAmountPaise: integer('net_amount_paise').notNull().default(0),
  currency: text('currency').notNull().default('INR'),
  gateway: text('gateway').notNull().default('razorpay'),
  gatewayOrderId: text('gateway_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  gatewayTransferId: text('gateway_transfer_id'),
  gatewayRefundId: text('gateway_refund_id'),
  paymentMethod: text('payment_method'), // upi | card | netbanking | cash
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}),
});

// Cash collected by a doctor at the clinic. Tracks the obligation to remit the
// platform's share + gateway-independent disbursement back into the settlement pool.
export const doctorCashLedger = pgTable('doctor_cash_ledger', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  entryType: text('entry_type').notNull(), // collection | obligation | remittance | adjustment
  amountPaise: integer('amount_paise').notNull().default(0),
  platformFeePaise: integer('platform_fee_paise').notNull().default(0),
  reference: text('reference'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  refundId: text('refund_id').notNull().unique(),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  paymentTransactionId: integer('payment_transaction_id').references(() => paymentTransactions.id),
  paymentId: text('payment_id'),
  amountPaise: integer('amount_paise').notNull(),
  status: text('status').notNull().default('pending'), // pending | processed | failed
  reason: text('reason'),
  gatewayRefundId: text('gateway_refund_id'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Every Razorpay webhook we receive, stored verbatim for audit + idempotency.
export const paymentWebhooks = pgTable('payment_webhooks', {
  id: serial('id').primaryKey(),
  event: text('event').notNull(),
  eventId: text('event_id').notNull().unique(),
  paymentId: text('payment_id'),
  orderId: text('order_id'),
  entity: jsonb('entity').notNull(),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const settlements = pgTable('settlements', {
  id: serial('id').primaryKey(),
  settlementId: text('settlement_id').notNull().unique(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  grossAmountPaise: integer('gross_amount_paise').notNull().default(0),
  platformFeePaise: integer('platform_fee_paise').notNull().default(0),
  gatewayFeePaise: integer('gateway_fee_paise').notNull().default(0),
  netAmountPaise: integer('net_amount_paise').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending | approved | paid | rejected
  payoutId: integer('payout_id').references(() => doctorPayouts.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
