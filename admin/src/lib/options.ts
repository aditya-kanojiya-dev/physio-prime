// Fixed option sets shared across admin and doctor-portal forms.
// Service areas are DB-managed (admin Locations page), not listed here.

export const CITIES = ['Nagpur']
export const STATES = ['Maharashtra']

export const DEPARTMENTS = [
  'Orthopedic', 'Sports', 'Neurological', 'Pediatric', 'Cardiopulmonary',
  'Geriatric', 'Gynecological', 'General Rehabilitation',
]

export const DESIGNATIONS = [
  'Physiotherapist', 'Senior Physiotherapist', 'Consultant Physiotherapist',
  'Head Physiotherapist', 'Chief Physiotherapist',
]

export const EXPERIENCE_YEARS = Array.from({ length: 41 }, (_, i) => String(i))

export const SPECIALTIES = [
  'Orthopedic Physiotherapy', 'Neurological Rehabilitation', 'Cardio-Pulmonary Therapy',
  'Sports Injury & Performance', "Women's Health Physiotherapy", 'Pediatric Physiotherapy',
  'Geriatric Rehabilitation', 'Hand & Micro-Rehabilitation', 'Psychosomatic & Ergonomic Care',
  'General Physiotherapy',
]

export const HOME_RADIUS_KM = ['5', '10', '15', '20']