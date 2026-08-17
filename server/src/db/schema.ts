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
  paymentStatus: text('payment_status').notNull().default('pending'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
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
