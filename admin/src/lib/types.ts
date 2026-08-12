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
  videoCallLink?: string | null;
  address?: Record<string, unknown> | null;
  cancellationReason?: string | null;
  createdAt?: string | null;
}

export interface ScheduleDay {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  active: boolean;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatFee(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
