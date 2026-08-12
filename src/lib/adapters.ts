import { Appointment, Category, ConsultationMode, Doctor, DoctorReview, Symptom } from '../types';

// ---- API wire shapes -------------------------------------------------------

export interface ApiDoctor {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  specialty: string | null;
  photo: string | null;
  rating: number | string;
  reviewCount: number;
  experienceYears: number | null;
  patientsTreated: number | null;
  languages: string[];
  location: { area?: string; city?: string; address?: string } | null;
  fees: Partial<Record<ConsultationMode, number>> | null;
  nextAvailable: string | null;
  verified: boolean;
  featured: boolean;
  gender: 'male' | 'female' | null;
  bio: string | null;
  expertise: string[];
  treatments: string[];
}

export interface ApiDoctorDetail extends ApiDoctor {
  education: string[];
  experience: { role: string; institution: string; period: string }[];
  registration: { number?: string; council?: string };
}

export interface ApiReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  patientName: string;
  symptom: string | null;
}

export interface ApiCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  color: string;
  conditions: string[];
}

export interface ApiSymptom {
  id: string;
  title: string;
  slug: string;
  iconName: string;
  description: string;
  popularFor: string;
  recoveryEstimate: string;
  image: string;
}

export interface ApiSlot {
  start: string;
  end: string;
}

export interface ApiAppointmentDoctor {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  specialty: string | null;
  photo: string | null;
  location: { area?: string; city?: string; address?: string } | null;
}

export interface ApiAppointment {
  id: string;
  doctor: ApiAppointmentDoctor | null;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  symptom: string | null;
  feePaise: number;
  address: unknown;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  patientGender: string | null;
  patientAge: number | null;
  patientWeight: string | null;
  patientHeight: string | null;
  videoCallLink: string | null;
  cancellationReason: string | null;
  createdAt: string;
}

// ---- formatting helpers ----------------------------------------------------

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatTimeSlot(timeSlot: string): string {
  return formatTime(timeSlot.split('-')[0]);
}

export function slotLabel(slot: ApiSlot): string {
  return `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
}

export function formatNextAvailable(dateStr: string | null): string {
  if (!dateStr) return 'Check schedule';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---- mappers ---------------------------------------------------------------

export function toDoctor(d: ApiDoctor): Doctor {
  return {
    phone: '',
    id: d.id,
    name: d.name,
    title: d.title || d.specialty || 'Physiotherapist',
    specialty: d.specialty || 'Physiotherapy',
    photo: d.photo || '',
    rating: Number(d.rating),
    reviewCount: d.reviewCount,
    experienceYears: d.experienceYears || 0,
    patientsTreated: d.patientsTreated || 0,
    languages: d.languages,
    location: {
      area: d.location?.area || 'Nagpur',
      city: d.location?.city || 'Nagpur',
      address: d.location?.address || '',
    },
    fees: {
      home: d.fees?.home || 0,
      online: d.fees?.online || 0,
      clinic: d.fees?.clinic || 0,
    },
    nextAvailable: formatNextAvailable(d.nextAvailable),
    verified: d.verified,
    featured: d.featured,
    bio: d.bio || '',
    education: [],
    experience: [],
    registration: { number: '', council: '' },
    expertise: d.expertise || [],
    treatments: d.treatments || [],
    reviewsList: [],
    gender: d.gender || 'male',
  };
}

export function mergeDoctorDetail(base: Doctor, detail: ApiDoctorDetail): Doctor {
  return {
    ...base,
    education: detail.education || [],
    experience: detail.experience || [],
    registration: {
      number: detail.registration?.number || '',
      council: detail.registration?.council || '',
    },
    expertise: detail.expertise || base.expertise,
    treatments: detail.treatments || base.treatments,
    bio: detail.bio || base.bio,
  };
}

export function toReview(r: ApiReview): DoctorReview {
  return {
    id: String(r.id),
    patientName: r.patientName,
    rating: r.rating,
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    comment: r.comment || '',
    verified: true,
    treatmentName: r.symptom || 'Physiotherapy Session',
  };
}

export function toSymptom(s: ApiSymptom): Symptom {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    iconName: s.iconName,
    description: s.description,
    popularFor: s.popularFor,
    recoveryEstimate: s.recoveryEstimate,
    image: s.image,
  };
}

export function toCategory(c: ApiCategory, doctors: Doctor[]): Category {  const terms = [...c.title.split(/\s+/), ...c.conditions]
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 3);
  const doctorCount = doctors.filter((doc) => {
    const hay = [doc.specialty, ...doc.expertise, ...doc.treatments, doc.bio].join(' ').toLowerCase();
    return terms.some((t) => hay.includes(t));
  }).length;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    doctorCount,
    image: c.image,
    conditions: c.conditions,
    color: c.color,
  };
}

function addressToText(address: unknown): string | undefined {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    const o = address as Record<string, unknown>;
    const primary = o.text ?? o.address ?? o.line1;
    if (typeof primary === 'string') return primary;
    const parts = Object.values(o).filter((v): v is string => typeof v === 'string');
    return parts.length ? parts.join(', ') : undefined;
  }
  return undefined;
}

export function toAppointment(a: ApiAppointment): Appointment {
  return {
    doctorPhone: '',
    id: a.id,
    doctorId: a.doctor?.id || '',
    doctorName: a.doctor?.name || 'Physiotherapist',
    doctorSpecialty: a.doctor?.title || a.doctor?.specialty || 'Physiotherapy',
    doctorPhoto: a.doctor?.photo || '',
    doctorLocation: a.doctor?.location
      ? [a.doctor.location.area, a.doctor.location.city].filter(Boolean).join(', ')
      : 'Nagpur',
    consultationMode: (a.mode as ConsultationMode) || 'home',
    date: a.date,
    timeSlot: formatTimeSlot(a.timeSlot),
    status: (a.status as Appointment['status']) || 'upcoming',
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    patientEmail: a.patientEmail || undefined,
    patientGender: (a.patientGender as Appointment['patientGender']) || undefined,
    patientAge: a.patientAge != null ? String(a.patientAge) : undefined,
    patientWeight: a.patientWeight || undefined,
    patientHeight: a.patientHeight || undefined,
    symptom: a.symptom || '',
    fee: Math.round(a.feePaise / 100),
    address: addressToText(a.address),
    createdAt: (a.createdAt || '').slice(0, 10),
    videoCallLink: a.videoCallLink || undefined,
    cancellationReason: a.cancellationReason || undefined,
    paymentMethod: a.paymentStatus === 'paid' ? 'Paid online' : a.paymentStatus === 'pending' ? 'Payment pending' : a.paymentStatus,
  };
}
