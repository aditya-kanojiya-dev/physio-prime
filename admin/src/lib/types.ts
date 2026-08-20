export interface DoctorProfile {
  id: number;
  name: string;
  title: string;
  specialty: string;
  slug: string;
  photo?: string | null;
  rating?: string | null;
  reviewCount?: number | null;
  experienceYears?: number | null;
  patientsTreated?: number | null;
  languages?: string[] | null;
  location?: Record<string, unknown> | null;
  fees?: Record<string, number> | null;
  nextAvailable?: string | null;
  verified?: boolean | null;
  featured?: boolean | null;
  gender?: string | null;
  bio?: string | null;
  education?: string[] | null;
  experience?: { role?: string; institution?: string; period?: string }[] | null;
  registration?: Record<string, string> | null;
  expertise?: string[] | null;
  treatments?: string[] | null;
  phone?: string | null;
  designation?: string | null;
  employeeId?: string | null;
  department?: string | null;
  address?: Record<string, unknown> | null;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  bookingId: string;
  mode: 'home' | 'online' | 'clinic';
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  symptom?: string | null;
  feePaise: number;
  paymentStatus: string;
  patientName: string;
  patientPhone?: string | null;
  patientRelation?: string | null;
  videoCallLink?: string | null;
  address?: Record<string, unknown> | null;
  cancellationReason?: string | null;
  createdAt?: string | null;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatFee(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// --- admin -------------------------------------------------------------

export interface AdminDoctor {
  id: number;
  userId: number;
  email: string;
  name: string;
  title: string | null;
  specialty: string | null;
  slug: string;
  photo: string | null;
  rating: string | null;
  reviewCount: number;
  experienceYears: number | null;
  patientsTreated: number | null;
  languages: string[];
  location: Record<string, unknown>;
  fees: Record<string, number>;
  nextAvailable: string | null;
  verified: boolean;
  featured: boolean;
  gender: string | null;
  bio: string | null;
  expertise: string[];
  treatments: string[];
  phone: string | null;
  designation: string | null;
  employeeId: string | null;
  department: string | null;
  address: Record<string, unknown>;
}

export interface AdminApplication {
  id: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt: string | null;
  notes: string | null;
  email: string;
  name: string;
}

export interface AdminPatient {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  appointmentCount: number;
}

export interface AdminAppointment extends Appointment {
  bookingId: string;
  doctorId: number;
  doctorName: string;
  patientEmail?: string | null;
  patientGender?: string | null;
  patientAge?: number | null;
  symptom?: string | null;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  address?: Record<string, unknown> | null;
}

export interface AdminCategory {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  color: string | null;
  conditions: string[];
  sortOrder: number;
  active: boolean;
}

export interface AdminSymptom {
  id: number;
  title: string;
  slug: string;
  iconName: string | null;
  description: string | null;
  popularFor: Record<string, unknown>;
  recoveryEstimate: string | null;
  image: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminSection {
  id: number;
  page: string;
  key: string;
  data: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
}

export interface AdminClient {
  patientId: number;
  name: string;
  email: string;
  phone: string | null;
  appointmentCount: number;
  lastVisit: string | null;
  totalSpentPaise: number;
}

export interface PatientDetail {
  patient: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    status: string;
    createdAt: string;
    gender: string | null;
    dob: string | null;
    weight: string | null;
    height: string | null;
    address: Record<string, unknown> | null;
  };
  summary: { appointmentCount: number; totalSpentPaise: number; paidCount: number };
  appointments: AdminAppointment[];
  prescriptions: {
    id: number;
    appointmentId: number;
    diagnosis: string | null;
    medicines: { name: string; dosage?: string; frequency?: string; duration?: string }[];
    advice: string | null;
    followUpDate: string | null;
    createdAt: string;
    doctorName: string;
    date: string;
  }[];
}

export interface AdminInsights {
  summary: { totalBookings: number; revenuePaise: number; newPatients: number };
  bookingsByMode: { mode: string; bookings: number }[];
  bookingsByDay: { date: string; bookings: number; revenuePaise: number }[];
  newPatientsByDay: { date: string; count: number }[];
  topDoctors: { doctorId: number; doctorName: string; bookings: number; revenuePaise: number }[];
  doctorClients: { doctorId: number; doctorName: string; clientCount: number; bookings: number; revenuePaise: number }[];
}

// --- doctor portal ------------------------------------------------------

export interface DoctorPatient {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  age: number | null;
  visitCount: number;
  lastVisit: string | null;
}

export interface DoctorPatientDetail {
  patient: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    gender: string | null;
    age: number | null;
    weight: string | null;
    height: string | null;
    address: Record<string, unknown> | null;
  };
  appointments: AdminAppointment[];
  prescriptions: {
    id: number;
    appointmentId: number;
    diagnosis: string | null;
    medicines: { name: string; dosage?: string; frequency?: string; duration?: string }[];
    advice: string | null;
    followUpDate: string | null;
    createdAt: string;
    date: string;
  }[];
}

export interface DoctorAppointmentDetail {
  appointment: AdminAppointment;
  prescription: {
    id: number;
    appointmentId: number;
    diagnosis: string | null;
    medicines: { name: string; dosage?: string; frequency?: string; duration?: string }[];
    advice: string | null;
    followUpDate: string | null;
    createdAt: string;
  } | null;
}

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

// --- Blog ---
export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  createdAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: 'draft' | 'published';
  authorType: 'admin' | 'doctor';
  authorId: number;
  categoryId: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: BlogCategory | null;
  tags?: BlogTag[];
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
}

// --- Reviews ---
export interface AdminReview {
  id: number;
  appointmentId: number;
  doctorId: number;
  rating: number;
  comment: string | null;
  featured: boolean;
  status: string;
  createdAt: string;
  doctorName: string;
  doctorSlug: string;
  patientName: string;
  patientEmail: string | null;
}

// --- Admin Profile ---
export interface AdminProfile {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
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
