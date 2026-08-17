# Doctor Dashboard – Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the doctor portal with earnings tracking, payment status, payout management, location management, community forum, doctor-to-doctor messaging, and an improved dashboard overview.

**Architecture:** New Drizzle tables for locations, payouts, community, messaging, and notifications. New Express routes under `/api/v1/doctor/*` for each module. New React pages in `admin/src/pages/` using existing design patterns (gradient cards, StatusPill, recharts). Map uses Leaflet + OpenStreetMap (free, no API key).

**Tech Stack:** Express 5, Drizzle ORM, PostgreSQL, React 19, Tailwind CSS v4, recharts, lucide-react, react-router-dom v7, @tanstack/react-query v5, Leaflet (new), react-leaflet (new), date-fns (new)

## Global Constraints

- Existing brand palette: blue-* remapped to cyan/teal in `admin/src/index.css`
- Card style: `rounded-3xl bg-white border border-slate-200 shadow-xl`
- Button gradient: `bg-gradient-to-r from-teal-600 to-blue-600`
- Status pills: `px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase`
- Font: Plus Jakarta Sans, Inter
- Money stored as integer paise; formatted to INR in UI via `formatFee()`
- All doctor routes require `requireAuth` + `requireRole('doctor')`
- Doctor resolved via `users.id` → `doctors.userId` lookup

---

## File Structure

### New Files — Server

| File | Purpose |
|------|---------|
| `server/src/routes/earnings.ts` | Doctor earnings + payment status endpoints |
| `server/src/routes/locations.ts` | Doctor location management endpoints |
| `server/src/routes/community.ts` | Forum posts, replies, votes, categories |
| `server/src/routes/messages.ts` | Doctor-to-doctor messaging |
| `server/src/routes/notifications.ts` (doctor) | In-app notification endpoints |

### New Files — Admin Frontend

| File | Purpose |
|------|---------|
| `admin/src/pages/EarningsPage.tsx` | Earnings dashboard with charts |
| `admin/src/pages/PaymentsPage.tsx` | Patient payment status table |
| `admin/src/pages/PayoutsPage.tsx` | Payout history + balance |
| `admin/src/pages/LocationsPage.tsx` | Location management + map |
| `admin/src/pages/CommunityPage.tsx` | Forum feed + categories |
| `admin/src/pages/CommunityDetailPage.tsx` | Single discussion thread |
| `admin/src/pages/MessagesPage.tsx` | Doctor messaging |
| `admin/src/components/NotificationsPanel.tsx` | Notification dropdown/bell |
| `admin/src/components/DoctorDashboard.tsx` | Improved overview page |

### Modified Files

| File | Changes |
|------|---------|
| `server/src/db/schema.ts` | Add 6 new tables |
| `server/src/index.ts` | Mount new routers |
| `admin/src/App.tsx` | Add 8 new routes |
| `admin/src/components/admin/AdminLayout.tsx` | Add nav items for doctor portal |
| `admin/src/lib/types.ts` | Add new interfaces |
| `admin/package.json` | Add leaflet, react-leaflet, date-fns |

---

## Task 1: Database Schema — New Tables

**Files:**
- Modify: `server/src/db/schema.ts`

**Tables to add:**

### `doctor_locations`
```typescript
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
```

### `doctor_payouts`
```typescript
export const doctorPayouts = pgTable('doctor_payouts', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  amountPaise: integer('amount_paise').notNull(),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  paymentMethod: text('payment_method'), // bank_transfer, upi
  transactionId: text('transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
```

### `community_categories`
```typescript
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
```

### `community_posts`
```typescript
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
```

### `community_replies`
```typescript
export const communityReplies = pgTable('community_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // self-reference for nested replies
  body: text('body').notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### `community_votes`
```typescript
export const communityVotes = pgTable('community_votes', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  postId: integer('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  replyId: integer('reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(), // 1 or -1
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.doctorId, t.postId), unique().on(t.doctorId, t.replyId)]);
```

### `conversations`
```typescript
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  doctor1Id: integer('doctor1_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  doctor2Id: integer('doctor2_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessage: text('last_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.doctor1Id, t.doctor2Id)]);
```

### `messages`
```typescript
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### `doctor_notifications`
```typescript
export const doctorNotifications = pgTable('doctor_notifications', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // reply, vote, mention, message, payment, appointment, location
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'), // route to navigate to
  read: boolean('read').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Steps:**

- [ ] **Step 1:** Add all table definitions to `server/src/db/schema.ts` (append after existing tables)

- [ ] **Step 2:** Generate migration
  ```bash
  cd server && npm run db:generate
  ```

- [ ] **Step 3:** Run migration
  ```bash
  cd server && npm run db:migrate
  ```

- [ ] **Step 4:** Add seed data for community categories to `server/src/routes/health.ts` or create a new seed script. Categories: General Medicine, Physiotherapy, Orthopedics, Pediatrics, Dermatology, Mental Health, Nutrition, Clinical Discussions, Practice Management, Technology, General Discussion

- [ ] **Step 5:** Commit
  ```bash
  git add server/src/db/schema.ts server/drizzle/
  git commit -m "feat(db): add tables for locations, payouts, community, messaging, notifications"
  ```

---

## Task 2: Server Routes — Earnings & Payments

**Files:**
- Create: `server/src/routes/earnings.ts`
- Modify: `server/src/index.ts` (mount router)

**Endpoints:**

### `GET /doctor/earnings/summary`
Returns aggregated earnings for the authenticated doctor.

Query params: `?period=week|month|year|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`

Response:
```json
{
  "summary": {
    "totalEarningsPaise": 1250000,
    "paidEarningsPaise": 1100000,
    "pendingEarningsPaise": 150000,
    "netEarningsPaise": 1200000,
    "refundTotalPaise": 50000,
    "appointmentCount": 45,
    "completedCount": 40,
    "cancelledCount": 3,
    "noShowCount": 2
  },
  "comparison": {
    "previousPeriodEarningsPaise": 1050000,
    "percentChange": 19.0
  }
}
```

Logic:
- `totalEarningsPaise` = SUM of `feePaise` for completed + paid appointments in period
- `paidEarningsPaise` = SUM where `paymentStatus = 'paid'` AND `status = 'completed'`
- `pendingEarningsPaise` = SUM where `paymentStatus = 'pending'` AND `status = 'upcoming'`
- `refundTotalPaise` = SUM where `paymentStatus = 'refunded'`
- `netEarningsPaise` = paidEarnings - refundTotal
- `comparison` = same period shifted back by the period length

### `GET /doctor/earnings/chart`
Returns earnings data points for chart rendering.

Query params: `?period=week|month|year`

Response:
```json
{
  "dataPoints": [
    { "date": "2026-08-01", "earningsPaise": 45000, "appointments": 3 },
    { "date": "2026-08-02", "earningsPaise": 32000, "appointments": 2 }
  ],
  "period": "month"
}
```

Logic:
- For `week`: last 7 days, one point per day
- For `month`: last 30 days, one point per day
- For `year`: last 12 months, one point per month (aggregated)

### `GET /doctor/payments`
Returns patient payment records for the doctor.

Query params: `?status=paid|pending|failed|refunded&page=1&limit=20&search=`

Response:
```json
{
  "payments": [
    {
      "bookingId": "APT-100001",
      "patientName": "Rahul Sharma",
      "mode": "home",
      "date": "2026-08-15",
      "feePaise": 150000,
      "paymentStatus": "paid",
      "razorpayPaymentId": "pay_xxx",
      "createdAt": "2026-08-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

**Steps:**

- [ ] **Step 1:** Create `server/src/routes/earnings.ts` with the two summary endpoints and payments endpoint. Use `requireAuth`, `requireRole('doctor')`, resolve doctor via `requireDoctor(userId)` pattern from existing `doctor.ts`.

- [ ] **Step 2:** Mount in `server/src/index.ts`:
  ```typescript
  import { doctorEarningsRouter } from './routes/earnings';
  // mount at /api/v1/doctor alongside existing doctorRouter
  app.use('/api/v1/doctor', doctorEarningsRouter);
  ```

- [ ] **Step 3:** Test endpoints manually with curl or existing test patterns

- [ ] **Step 4:** Commit
  ```bash
  git add server/src/routes/earnings.ts server/src/index.ts
  git commit -m "feat(api): add doctor earnings, payments endpoints"
  ```

---

## Task 3: Server Routes — Payouts

**Files:**
- Create: `server/src/routes/payouts.ts`
- Modify: `server/src/index.ts`

**Endpoints:**

### `GET /doctor/payouts/summary`
```json
{
  "availableBalancePaise": 850000,
  "pendingPayoutPaise": 200000,
  "totalPaidPaise": 3500000,
  "lastPayoutDate": "2026-08-01"
}
```

Logic:
- `availableBalancePaise` = paidEarnings (completed+paid) minus sum of completed payouts
- `pendingPayoutPaise` = sum of payouts with status 'pending' or 'processing'
- `totalPaidPaise` = sum of payouts with status 'completed'

### `GET /doctor/payouts`
Returns payout history.

Query params: `?page=1&limit=20&status=completed|pending|processing|failed`

Response:
```json
{
  "payouts": [
    {
      "id": 1,
      "amountPaise": 200000,
      "status": "completed",
      "paymentMethod": "bank_transfer",
      "transactionId": "TXN-xxx",
      "createdAt": "2026-08-01T00:00:00Z",
      "processedAt": "2026-08-02T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 15, "totalPages": 1 }
}
```

### `POST /doctor/payouts/request`
Request a payout (doctor initiates).

Body: `{ "amountPaise": 100000, "paymentMethod": "bank_transfer" }`

Validates: amount <= availableBalance, amount > 0

Returns the created payout record.

**Steps:**

- [ ] **Step 1:** Create `server/src/routes/payouts.ts`

- [ ] **Step 2:** Mount in `server/src/index.ts`

- [ ] **Step 3:** Commit
  ```bash
  git add server/src/routes/payouts.ts server/src/index.ts
  git commit -m "feat(api): add doctor payout endpoints"
  ```

---

## Task 4: Server Routes — Location Management

**Files:**
- Create: `server/src/routes/locations.ts`
- Modify: `server/src/index.ts`

**Endpoints:**

### `GET /doctor/locations`
List all locations for the doctor.

Response:
```json
{
  "locations": [
    {
      "id": 1,
      "name": "Dharampeth Clinic",
      "address": "123 Main St",
      "area": "Dharampeth",
      "city": "Nagpur",
      "state": "Maharashtra",
      "pincode": "440010",
      "lat": "21.1458",
      "lng": "79.0882",
      "radiusKm": "10",
      "isPrimary": true,
      "active": true
    }
  ],
  "homeVisitsEnabled": true,
  "maxRadiusKm": "15"
}
```

### `POST /doctor/locations`
Add a new location.

Body:
```json
{
  "name": "Civil Lines Clinic",
  "address": "456 Park Road",
  "area": "Civil Lines",
  "city": "Nagpur",
  "state": "Maharashtra",
  "pincode": "440001",
  "lat": "21.1500",
  "lng": "79.0900",
  "radiusKm": "10"
}
```

### `PATCH /doctor/locations/:id`
Update a location.

### `DELETE /doctor/locations/:id`
Delete a location (cascade from schema).

### `PATCH /doctor/locations/:id/primary`
Set a location as primary (unset others).

### `PATCH /doctor/locations/settings`
Update location preferences.

Body:
```json
{
  "homeVisitsEnabled": true,
  "maxRadiusKm": "15"
}
```

Note: Store `homeVisitsEnabled` and `maxRadiusKm` on the `doctors` table as new columns, or use a JSONB `locationSettings` field. Prefer adding two columns to `doctors`:

```typescript
// Add to doctors table in schema.ts
homeVisitsEnabled: boolean('home_visits_enabled').notNull().default(false),
maxRadiusKm: numeric('max_radius_km').notNull().default('10'),
```

**Steps:**

- [ ] **Step 1:** Add `homeVisitsEnabled` and `maxRadiusKm` columns to `doctors` table in schema, regenerate migration

- [ ] **Step 2:** Create `server/src/routes/locations.ts`

- [ ] **Step 3:** Mount in `server/src/index.ts`

- [ ] **Step 4:** Commit
  ```bash
  git add server/src/routes/locations.ts server/src/db/schema.ts server/src/index.ts
  git commit -m "feat(api): add doctor location management endpoints"
  ```

---

## Task 5: Server Routes — Community Forum

**Files:**
- Create: `server/src/routes/community.ts`
- Modify: `server/src/index.ts`

**Endpoints:**

### Public (no auth required for reading)

### `GET /community/categories`
List all active categories.

### `GET /community/posts`
List posts with filters.

Query params: `?category=slug&sort=new|top|unanswered&page=1&limit=20&search=`

Response:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Best practices for post-op knee rehab",
      "body": "...",
      "tags": ["physiotherapy", "rehabilitation"],
      "category": { "name": "Physiotherapy", "slug": "physiotherapy" },
      "doctor": { "name": "Dr. Priya Patel", "specialty": "Orthopedics", "photo": null },
      "replyCount": 12,
      "voteCount": 24,
      "viewCount": 156,
      "pinned": false,
      "createdAt": "2026-08-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 120, "totalPages": 6 }
}
```

### `GET /community/posts/:id`
Get single post with replies.

Response:
```json
{
  "post": { "...post fields...", "viewCount": 157 },
  "replies": [
    {
      "id": 1,
      "body": "...",
      "doctor": { "name": "Dr. Amit Kumar", "specialty": "Sports Medicine", "photo": null },
      "voteCount": 8,
      "accepted": false,
      "parentId": null,
      "createdAt": "2026-08-15T11:00:00Z",
      "replies": [ ...nested replies... ]
    }
  ],
  "userVote": 1
}
```

### Auth required (doctor)

### `POST /community/posts`
Create a new post.

Body:
```json
{
  "title": "Question about...",
  "body": "Detailed description...",
  "categoryId": 2,
  "tags": ["tag1", "tag2"]
}
```

### `POST /community/posts/:id/replies`
Reply to a post.

Body: `{ "body": "My answer...", "parentId": null }`

### `POST /community/posts/:id/vote`
Upvote/downvote a post.

Body: `{ "value": 1 }` or `{ "value": -1 }`

### `POST /community/replies/:id/vote`
Upvote/downvote a reply.

### `POST /community/replies/:id/accept`
Mark a reply as accepted (post author only).

### `GET /community/posts/mine`
List the doctor's own posts.

**Steps:**

- [ ] **Step 1:** Create `server/src/routes/community.ts`

- [ ] **Step 2:** Mount in `server/src/index.ts`

- [ ] **Step 3:** Seed community categories via a script or in the existing seed

- [ ] **Step 4:** Commit
  ```bash
  git add server/src/routes/community.ts server/src/index.ts
  git commit -m "feat(api): add community forum endpoints"
  ```

---

## Task 6: Server Routes — Messaging & Notifications

**Files:**
- Create: `server/src/routes/messages.ts`
- Create: `server/src/routes/doctor-notifications.ts`
- Modify: `server/src/index.ts`

**Messaging Endpoints:**

### `GET /doctor/messages/conversations`
List conversations for the doctor.

Response:
```json
{
  "conversations": [
    {
      "id": 1,
      "otherDoctor": { "id": 2, "name": "Dr. Amit Kumar", "specialty": "Orthopedics", "photo": null },
      "lastMessage": "Thanks for the referral!",
      "lastMessageAt": "2026-08-15T14:00:00Z",
      "unreadCount": 2
    }
  ]
}
```

### `GET /doctor/messages/conversations/:id`
Get messages in a conversation.

Query params: `?before= messageId&limit=50`

### `POST /doctor/messages/conversations`
Start a new conversation.

Body: `{ "toDoctorId": 2, "message": "Hello, I wanted to discuss..." }`

### `POST /doctor/messages/conversations/:id/replies`
Send a message in a conversation.

Body: `{ "message": "Here's my thought..." }`

### `GET /doctor/messages/unread-count`
Get total unread message count (for badge).

### `GET /doctor/messages/search-doctors`
Search doctors to message.

Query params: `?q=amit&limit=10`

**Notification Endpoints:**

### `GET /doctor/notifications`
List notifications for the doctor.

Query params: `?page=1&limit=20&unread=true`

### `GET /doctor/notifications/unread-count`
Get unread notification count.

### `PATCH /doctor/notifications/:id/read`
Mark a notification as read.

### `PATCH /doctor/notifications/read-all`
Mark all as read.

**Steps:**

- [ ] **Step 1:** Create `server/src/routes/messages.ts`

- [ ] **Step 2:** Create `server/src/routes/doctor-notifications.ts`

- [ ] **Step 3:** Mount both in `server/src/index.ts`

- [ ] **Step 4:** Commit
  ```bash
  git add server/src/routes/messages.ts server/src/routes/doctor-notifications.ts server/src/index.ts
  git commit -m "feat(api): add messaging and notification endpoints"
  ```

---

## Task 7: Frontend — Shared Components & Types

**Files:**
- Modify: `admin/src/lib/types.ts`
- Modify: `admin/package.json`

**Steps:**

- [ ] **Step 1:** Add to `admin/package.json` dependencies:
  ```json
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "date-fns": "^4.1.0"
  ```
  And devDependencies:
  ```json
  "@types/leaflet": "^1.9.16"
  ```

- [ ] **Step 2:** Run `npm install` from root

- [ ] **Step 3:** Add new types to `admin/src/lib/types.ts`:
  ```typescript
  // --- Earnings ---
  export interface EarningsSummary {
    totalEarningsPaise: number;
    paidEarningsPaise: number;
    pendingEarningsPaise: number;
    netEarningsPaise: number;
    refundTotalPaise: number;
    appointmentCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
  }

  export interface EarningsComparison {
    previousPeriodEarningsPaise: number;
    percentChange: number;
  }

  export interface EarningsChartPoint {
    date: string;
    earningsPaise: number;
    appointments: number;
  }

  export interface PaymentRecord {
    bookingId: string;
    patientName: string;
    mode: string;
    date: string;
    feePaise: number;
    paymentStatus: string;
    razorpayPaymentId: string | null;
    createdAt: string;
  }

  // --- Payouts ---
  export interface PayoutSummary {
    availableBalancePaise: number;
    pendingPayoutPaise: number;
    totalPaidPaise: number;
    lastPayoutDate: string | null;
  }

  export interface Payout {
    id: number;
    amountPaise: number;
    status: string;
    paymentMethod: string | null;
    transactionId: string | null;
    notes: string | null;
    createdAt: string;
    processedAt: string | null;
  }

  // --- Locations ---
  export interface DoctorLocation {
    id: number;
    name: string;
    address: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    lat: string | null;
    lng: string | null;
    radiusKm: string;
    isPrimary: boolean;
    active: boolean;
  }

  // --- Community ---
  export interface CommunityCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }

  export interface CommunityPost {
    id: number;
    title: string;
    body: string;
    tags: string[];
    category: { name: string; slug: string } | null;
    doctor: { name: string; specialty: string | null; photo: string | null };
    replyCount: number;
    voteCount: number;
    viewCount: number;
    pinned: boolean;
    closed: boolean;
    createdAt: string;
  }

  export interface CommunityReply {
    id: number;
    body: string;
    doctor: { name: string; specialty: string | null; photo: string | null };
    voteCount: number;
    accepted: boolean;
    parentId: number | null;
    createdAt: string;
    replies: CommunityReply[];
  }

  // --- Messages ---
  export interface Conversation {
    id: number;
    otherDoctor: { id: number; name: string; specialty: string | null; photo: string | null };
    lastMessage: string | null;
    lastMessageAt: string;
    unreadCount: number;
  }

  export interface Message {
    id: number;
    senderId: number;
    body: string;
    read: boolean;
    createdAt: string;
  }

  // --- Notifications ---
  export interface DoctorNotification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    read: boolean;
    metadata: Record<string, unknown>;
    createdAt: string;
  }
  ```

- [ ] **Step 4:** Commit
  ```bash
  git add admin/package.json admin/src/lib/types.ts package-lock.json
  git commit -m "feat(admin): add types and dependencies for new modules"
  ```

---

## Task 8: Frontend — Earnings Dashboard Page

**Files:**
- Create: `admin/src/pages/EarningsPage.tsx`
- Modify: `admin/src/App.tsx` (add route)
- Modify: `admin/src/components/admin/AdminLayout.tsx` (add nav item)

**Design:**
- Top: Time period selector (Weekly / Monthly / Yearly / Custom) as gradient filter pills
- Row of 5 metric cards: Total Earnings, Paid, Pending, Upcoming Payout, Net Earnings
  - Each card: icon + label + large formatted amount + subtle trend indicator
  - Total Earnings card should be larger/more prominent (colored gradient background)
- Chart section: recharts AreaChart with gradient fill, period switcher
  - Show comparison badge: "+18.4% vs last month"
  - X-axis: dates, Y-axis: ₹ amounts
  - Tooltip showing exact values
- Below chart: Recent payments mini-table (last 5)

**Component structure:**
```tsx
// EarningsPage.tsx
export function EarningsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  const { data: summary } = useQuery({ queryKey: ['doctor/earnings/summary', period, customRange], queryFn: () => api.get(`/doctor/earnings/summary?period=${period}`) });
  const { data: chart } = useQuery({ queryKey: ['doctor/earnings/chart', period], queryFn: () => api.get(`/doctor/earnings/chart?period=${period}`) });
  const { data: payments } = useQuery({ queryKey: ['doctor/payments', 1], queryFn: () => api.get('/doctor/payments?limit=5') });

  return (
    <div className="space-y-6">
      <header>...</header>
      <PeriodSelector />
      <MetricCards />
      <EarningsChart />
      <RecentPayments />
    </div>
  )
}
```

**Metric card styling:**
```
p-6 rounded-3xl bg-white border border-slate-200 shadow-xl
  icon in rounded-2xl with gradient bg
  label: text-xs font-extrabold uppercase text-slate-500
  value: text-2xl font-black text-slate-900
  trend: text-xs font-bold (emerald for positive, rose for negative)
```

**Chart styling:**
```
rounded-3xl bg-white border border-slate-200 p-6 shadow-xl
  recharts AreaChart with gradient fill
  stroke: #0891B2 (cyan-600)
  fill: url(#gradient) with cyan-500/20 to transparent
  grid: #E2E8F0
  tooltip: custom styled with bg-white rounded-xl shadow-lg
```

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/EarningsPage.tsx` with all sections

- [ ] **Step 2:** Add route to `admin/src/App.tsx`:
  ```tsx
  { path: 'earnings', element: <EarningsPage /> },
  ```

- [ ] **Step 3:** Add nav item to `admin/src/components/admin/AdminLayout.tsx` in `doctorNav`:
  ```tsx
  { to: '/earnings', label: 'Earnings', icon: DollarSign },
  ```

- [ ] **Step 4:** Run typecheck: `cd admin && npx tsc --noEmit`

- [ ] **Step 5:** Commit
  ```bash
  git add admin/src/pages/EarningsPage.tsx admin/src/App.tsx admin/src/components/admin/AdminLayout.tsx
  git commit -m "feat(admin): add earnings dashboard page"
  ```

---

## Task 9: Frontend — Patient Payments Page

**Files:**
- Create: `admin/src/pages/PatientPaymentsPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design:**
- Filter bar: status pills (All / Paid / Pending / Failed / Refunded) + search input
- Table on desktop, cards on mobile
- Each row: patient name, booking ID, mode badge, date, amount (formatted INR), status pill, transaction ID
- Status pill colors: paid=emerald, pending=amber, failed=rose, refunded=slate, cancelled=rose
- Pagination at bottom

**Table styling** (match existing `admin/AppointmentsPage.tsx` pattern):
```
bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl
  header: text-[10px] font-extrabold uppercase tracking-wider text-slate-500
  rows: text-xs hover:bg-slate-50 transition-colors
```

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/PatientPaymentsPage.tsx`

- [ ] **Step 2:** Add route and nav item

- [ ] **Step 3:** Typecheck + commit

---

## Task 10: Frontend — Payouts Page

**Files:**
- Create: `admin/src/pages/PayoutsPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design:**
- Top section: 3 large metric cards (Available Balance, Pending Payout, Total Paid)
  - Available Balance card: large prominent, gradient background, "Request Payout" CTA button
- Request Payout modal: amount input, payment method selector (Bank Transfer / UPI), confirm
- Payout History table: date, amount, status pill, payment method, transaction ID
- Visual payout timeline for each payout: Appointment Completed → Payment Received → Processing → Payout Completed
  - Use horizontal step indicator with dots and connecting lines

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/PayoutsPage.tsx`

- [ ] **Step 2:** Add route and nav item

- [ ] **Step 3:** Typecheck + commit

---

## Task 11: Frontend — Location Management Page

**Files:**
- Create: `admin/src/pages/LocationsPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`
- Install: `leaflet`, `react-leaflet`, `date-fns`

**Design:**
- Split layout on desktop: left = location list + settings, right = map
- Mobile: stacked (list on top, map below, collapsible)
- Location list: cards for each location with name, area, city, radius badge, primary indicator, active toggle
  - Each card has: Edit, Delete, Set Primary buttons
- Map section: Leaflet map with OpenStreetMap tiles
  - Marker for each location
  - Circle overlay showing radius (semi-transparent cyan fill)
  - Click on map to add new location (reverse geocode or manual entry)
- Settings section:
  - Home Visits toggle (on/off)
  - Max Visitation Radius slider/input
- Add/Edit Location modal:
  - Name, Address, Area, City, State, Pincode
  - Lat/Lng (auto-filled from map click, editable)
  - Radius (km) input with slider

**Leaflet map component:**
```tsx
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function LocationMap({ locations, onMapClick }: { locations: DoctorLocation[]; onMapClick?: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={[21.1458, 79.0882]} zoom={12} className="h-full w-full rounded-2xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {locations.map(loc => (
        <Marker key={loc.id} position={[Number(loc.lat), Number(loc.lng)]} />
        <Circle key={`circle-${loc.id}`} center={[Number(loc.lat), Number(loc.lng)]} radius={Number(loc.radiusKm) * 1000} />
      ))}
    </MapContainer>
  );
}
```

**Steps:**

- [ ] **Step 1:** Add leaflet dependencies, run npm install

- [ ] **Step 2:** Create `admin/src/pages/LocationsPage.tsx` with map, list, settings, and modals

- [ ] **Step 3:** Add route and nav item

- [ ] **Step 4:** Typecheck + commit

---

## Task 12: Frontend — Community Forum Page

**Files:**
- Create: `admin/src/pages/CommunityPage.tsx`
- Create: `admin/src/pages/CommunityDetailPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design — Community Feed (CommunityPage.tsx):**

Three-column layout on desktop, single column on mobile:

**Left sidebar:** Category list with icons and counts
```
All Discussions (120)
Physiotherapy (45)
Orthopedics (32)
...
```
Each category: icon + name + post count badge, clickable to filter

**Center feed:** Discussion cards
```
┌─────────────────────────────────────────┐
│ [Avatar] Dr. Priya Patel · Orthopedics │
│ Best practices for post-op knee rehab   │
│ I've been seeing patients who...        │
│ [physiotherapy] [rehabilitation]         │
│ ▲ 24  💬 12  👁 156  · 2 hours ago     │
└─────────────────────────────────────────┘
```

- Vote count with up arrow (clickable)
- Reply count with comment icon
- View count with eye icon
- Time ago (using date-fns `formatDistanceToNow`)
- Tags as small pills

**Right sidebar (desktop only):**
- "Ask the Community" CTA button (prominent gradient)
- Trending discussions (top 5 by votes this week)
- Active doctors (top 5 by posts)

**Top bar:** Sort tabs (New / Top / Unanswered) + search input

**Design — Ask a Question modal/page:**
- Title input
- Rich text body (textarea with markdown support or plain text)
- Category selector (dropdown)
- Tags input (comma-separated, shown as pills)
- Attachments placeholder (file upload area, future)
- Submit button

**Design — CommunityDetailPage.tsx:**

- Original question at top with full body, tags, vote buttons
- Replies below, sorted by votes (accepted answer highlighted at top)
- Each reply: avatar, doctor name, specialty, body, vote buttons, time, reply button
- Nested replies shown with left border indentation
- Reply editor at bottom (textarea + submit)
- Breadcrumb back to feed

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/CommunityPage.tsx`

- [ ] **Step 2:** Create `admin/src/pages/CommunityDetailPage.tsx`

- [ ] **Step 3:** Add routes (`community` and `community/:id`) and nav item

- [ ] **Step 4:** Typecheck + commit

---

## Task 13: Frontend — Messages Page

**Files:**
- Create: `admin/src/pages/MessagesPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design:**

Split-panel messaging layout (like WhatsApp/Telegram):

**Left panel (conversation list):**
- Search bar at top
- Conversation items: avatar, doctor name, specialty, last message preview, timestamp, unread badge
- Active conversation highlighted

**Right panel (chat):**
- Header: doctor name, specialty, online indicator
- Messages area: scrollable, messages grouped by date
  - Sent messages: right-aligned, gradient bg (teal-600 to blue-600)
  - Received messages: left-aligned, bg-slate-100
  - Each message: text, timestamp
  - Unread messages: slightly different bg
- Input area: textarea + send button
- Empty state when no conversation selected: "Select a conversation or start a new one"

**New conversation flow:**
- "New Message" button opens search modal
- Search doctors by name/specialty
- Click to start conversation, type first message, send

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/MessagesPage.tsx`

- [ ] **Step 2:** Add route and nav item (with message icon + unread badge)

- [ ] **Step 3:** Typecheck + commit

---

## Task 14: Frontend — Notifications Panel

**Files:**
- Create: `admin/src/components/NotificationsPanel.tsx`
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design:**

Bell icon in the header (both mobile and desktop) with unread count badge.

Clicking opens a dropdown panel:
- Header: "Notifications" + "Mark all read" link
- Notification list: scrollable, grouped by type
  - Community: blue icon
  - Payments: emerald icon
  - Appointments: amber icon
  - Messages: purple icon
- Each notification: icon, title, body preview, time ago, read/unread indicator (dot)
- Clicking navigates to the `link` path and marks as read
- Empty state: "You're all caught up!"

**Badge:** Red dot with count (show 99+ if > 99)

**Polling:** Re-fetch unread count every 30 seconds when panel is closed. When open, re-fetch on focus.

**Steps:**

- [ ] **Step 1:** Create `admin/src/components/NotificationsPanel.tsx`

- [ ] **Step 2:** Integrate into `AdminLayout.tsx` header

- [ ] **Step 3:** Typecheck + commit

---

## Task 15: Frontend — Improved Dashboard Overview

**Files:**
- Create: `admin/src/pages/DoctorOverviewPage.tsx`
- Modify: `admin/src/App.tsx` (add as default doctor route)
- Modify: `admin/src/components/admin/AdminLayout.tsx`

**Design:**

Replace the current redirect from `/` to `/appointments` with a proper dashboard.

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│ Good Morning, Dr. [Name]          [Today: Aug 17]   │
│ Here's your practice overview for today.             │
├──────────┬──────────┬──────────┬────────────────────┤
│ Today's  │ Monthly  │ Pending  │ Completed          │
│ Appts    │ Earnings │ Payout   │ Visits             │
│    5     │ ₹45,000  │ ₹12,000  │    38              │
├──────────┴──────────┴──────────┴────────────────────┤
│                    Earnings Chart                    │
│              (mini version, last 7 days)             │
├─────────────────────────┬───────────────────────────┤
│  Upcoming Appointments  │  Recent Community         │
│  (next 5)              │  (top 3 posts)            │
├─────────────────────────┼───────────────────────────┤
│  Unread Messages (3)   │  Location Status           │
│  (latest 3)            │  (active locations list)   │
└─────────────────────────┴───────────────────────────┘
```

**KPI cards:** Use `MetricCard` pattern from admin dashboard, with icons from lucide-react

**Earnings chart:** Mini AreaChart (recharts), last 7 days, no axes labels, just the area with gradient

**Upcoming appointments:** Small cards with patient name, time, mode badge, date

**Recent community:** Post titles with vote count, link to community page

**Unread messages:** Conversation previews with doctor name, last message

**Location status:** List of active locations with primary indicator

**Steps:**

- [ ] **Step 1:** Create `admin/src/pages/DoctorOverviewPage.tsx`

- [ ] **Step 2:** Update `admin/src/App.tsx` to use this as the default route for doctors (change the `/` redirect)

- [ ] **Step 3:** Add "Dashboard" as first nav item in `doctorNav` in `AdminLayout.tsx`

- [ ] **Step 4:** Typecheck + commit

---

## Task 16: Patient App — Location Integration

**Files:**
- Modify: `src/pages/FindDoctorsPage.tsx` (or equivalent doctor listing page)
- Modify: `server/src/routes/doctors.ts` (add location-based filtering)

**Backend changes:**

Add query param to `GET /doctors`: `?area=Dharampeth`

Logic:
- Join `doctors` with `doctor_locations` on `doctors.id = doctor_locations.doctor_id`
- Filter where `doctor_locations.area = ?` AND `doctor_locations.active = true`
- Only include doctors where `home_visits_enabled = true` for home mode

**Frontend changes:**

On the patient-facing doctor listing page:
- Add location dropdown/search (areas from active doctor locations)
- When a location is selected, filter doctors by that area
- Show location badges on doctor cards:
  - "Home Visit Available" badge (if homeVisitsEnabled)
  - "📍 Dharampeth · Civil Lines" (list of active areas)

**Steps:**

- [ ] **Step 1:** Add area filter to `GET /doctors` endpoint in `server/src/routes/doctors.ts`

- [ ] **Step 2:** Add location filter UI to the patient app's doctor listing

- [ ] **Step 3:** Show location badges on doctor cards

- [ ] **Step 4:** Typecheck + commit

---

## Task 17: Wiring & Polish

**Files:**
- Various (final integration pass)

**Steps:**

- [ ] **Step 1:** Verify all routes are wired in `App.tsx` and `AdminLayout.tsx`

- [ ] **Step 2:** Verify all nav items appear correctly for doctor role

- [ ] **Step 3:** Run full typecheck across all packages:
  ```bash
  npm run build  # from root (runs tsc for all workspaces)
  ```

- [ ] **Step 4:** Run lint:
  ```bash
  npm run lint  # from root
  ```

- [ ] **Step 5:** Manual smoke test checklist:
  - Login as doctor → see dashboard overview
  - Navigate to each new page → data loads
  - Earnings chart renders with period switching
  - Payments table shows with filters
  - Payouts page shows balance + history
  - Locations page shows map with markers
  - Add/edit/delete location works
  - Community feed loads, categories filter works
  - Create post, reply, vote works
  - Messages: start conversation, send message
  - Notifications bell shows count, panel opens
  - Responsive: all pages work on mobile viewport

- [ ] **Step 6:** Final commit
  ```bash
  git add -A
  git commit -m "feat: doctor dashboard expansion — earnings, payments, payouts, locations, community, messaging, notifications"
  ```

---

## Summary

| Task | Module | New Files | API Endpoints | Pages |
|------|--------|-----------|---------------|-------|
| 1 | DB Schema | 0 | 0 | 0 |
| 2 | Earnings API | 1 | 3 | 0 |
| 3 | Payouts API | 1 | 3 | 0 |
| 4 | Locations API | 1 | 6 | 0 |
| 5 | Community API | 1 | 8 | 0 |
| 6 | Messages + Notifications API | 2 | 10 | 0 |
| 7 | Types + Deps | 0 | 0 | 0 |
| 8 | Earnings Page | 1 | 0 | 1 |
| 9 | Payments Page | 1 | 0 | 1 |
| 10 | Payouts Page | 1 | 0 | 1 |
| 11 | Locations Page | 1 | 0 | 1 |
| 12 | Community Pages | 2 | 0 | 2 |
| 13 | Messages Page | 1 | 0 | 1 |
| 14 | Notifications Panel | 1 | 0 | 0 (component) |
| 15 | Dashboard Overview | 1 | 0 | 1 |
| 16 | Patient App Integration | 0 | 1 | 1 (modify) |
| 17 | Wiring & Polish | 0 | 0 | 0 |
| **Total** | | **14 new** | **31 new** | **8 new + 1 modified** |
