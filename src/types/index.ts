export type ConsultationMode = 'home' | 'online' | 'clinic';

export interface DoctorReview {
  id: string;
  patientName: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  treatmentName: string;
}

export interface Doctor {
  phone: string;
  id: string;
  name: string;
  title: string;
  specialty: string;
  photo: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  patientsTreated: number;
  languages: string[];
  location: {
    area: string;
    city: string;
    address: string;
  };
  fees: {
    home: number;
    online: number;
    clinic: number;
  };
  nextAvailable: string;
  verified: boolean;
  featured: boolean;
  bio: string;
  education: string[];
  experience: {
    role: string;
    institution: string;
    period: string;
  }[];
  registration: {
    number: string;
    council: string;
  };
  expertise: string[];
  treatments: string[];
  reviewsList: DoctorReview[];
  gender: 'male' | 'female';
}

export interface Symptom {
  id: string;
  title: string;
  slug: string;
  iconName: string;
  description: string;
  popularFor: string;
  recoveryEstimate: string;
  image: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  description: string;
  doctorCount: number;
  image: string;
  conditions: string[];
  color: string;
}

export interface Appointment {
  doctorPhone: string;
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhoto: string;
  doctorLocation: string;
  consultationMode: ConsultationMode;
  date: string; // e.g. "2026-08-10"
  timeSlot: string; // e.g. "03:00 PM"
  status: 'upcoming' | 'completed' | 'cancelled';
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientGender?: 'male' | 'female' | 'other';
  patientAge?: string;
  patientWeight?: string;
  patientHeight?: string;
  symptom: string;
  fee: number;
  address?: string;
  createdAt: string;
  videoCallLink?: string;
  cancellationReason?: string;
  paymentMethod?: string;
}
