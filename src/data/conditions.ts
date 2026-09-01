import { Symptom } from '../types';

export interface ConditionLink {
  name: string;
  slug: string;
}

export interface ConditionGroup {
  specialtyName: string;
  specialtySlug: string | null;
  conditions: ConditionLink[];
}

// The DB tags each condition row with its specialty in `popularFor` (jsonb array,
// e.g. ["Musculoskeletal / Orthopedic"]). Legacy marketing rows use a plain string.
function specialtyOf(s: Symptom): string | null {
  return Array.isArray(s.popularFor) ? s.popularFor[0] ?? null : null;
}

const SPECIALTY_TO_CATEGORY: Record<string, string> = {
  'Musculoskeletal / Orthopedic': 'orthopedic',
  'Post-Surgical Rehabilitation': 'orthopedic',
  'Sports Injuries': 'sports-injury',
  'Neurological Conditions': 'neurological',
  'Pediatric Conditions': 'pediatrics',
  'Geriatric Care': 'geriatric',
  'Cardio-Respiratory': 'cardio-pulmonary',
  "Women's Health": 'womens-health',
  'Chronic Pain & Lifestyle': 'psychiatry-mindbody',
};

// Treatment modalities (Dry Needling, Cupping...) are not patient-facing conditions
const EXCLUDED_SPECIALTIES = new Set(['Therapy Techniques']);

export function conditionsForCategory(categorySlug: string, symptoms: Symptom[]): ConditionLink[] {
  const specialty = Object.entries(SPECIALTY_TO_CATEGORY).find(([, s]) => s === categorySlug)?.[0];
  if (!specialty) return [];
  return symptoms
    .filter((s) => specialtyOf(s) === specialty)
    .map((s) => ({ name: s.title, slug: s.slug }));
}

export function buildConditionGroups(symptoms: Symptom[]): ConditionGroup[] {
  const groups = new Map<string, ConditionGroup>();
  for (const s of symptoms) {
    const specialty = specialtyOf(s);
    if (!specialty || EXCLUDED_SPECIALTIES.has(specialty)) continue;
    if (!groups.has(specialty)) {
      groups.set(specialty, {
        specialtyName: specialty,
        specialtySlug: SPECIALTY_TO_CATEGORY[specialty] ?? null,
        conditions: [],
      });
    }
    groups.get(specialty)!.conditions.push({ name: s.title, slug: s.slug });
  }
  return [...groups.values()];
}

export interface ConditionDetailData {
  conditionName: string;
  conditionSlug: string;
  specialtyName: string | null;
  specialtySlug: string | null;
  tagLines: string[];
  quickAnswer: string;
  quickAnswerChecklist: string[];
  aboutText: string;
  howItHelps: string[];
  commonSigns: string[];
  urgentCareSymptoms: string[];
  faqs: { question: string; answer: string }[];
  relatedConditions: ConditionLink[];
}

// ponytail: copy is templated from symptom fields — editorial per-condition pages can
// override later by adding a content map keyed by slug.
export function getConditionDetail(symptom: Symptom, allSymptoms: Symptom[]): ConditionDetailData {
  const name = symptom.title;
  const specialty = specialtyOf(symptom);
  const signs = (symptom.symptomsList ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const related = allSymptoms
    .filter((s) => s.slug !== symptom.slug && specialtyOf(s) === specialty)
    .slice(0, 3)
    .map((s) => ({ name: s.title, slug: s.slug }));

  return {
    conditionName: name,
    conditionSlug: symptom.slug,
    specialtyName: specialty,
    specialtySlug: specialty ? SPECIALTY_TO_CATEGORY[specialty] ?? null : null,
    tagLines: [
      specialty ? `${specialty.replace(/\/.*$/, '').trim()} physiotherapy` : 'Evidence-based physiotherapy',
      'Personalised exercise & manual therapy plan',
      symptom.recoveryEstimate ? `Typical recovery: ${symptom.recoveryEstimate.toLowerCase()}` : 'Recovery at your own pace, at home',
    ],
    quickAnswer: `Yes — physiotherapy is a first-line, non-surgical option for ${name.toLowerCase()}. ${symptom.description ?? ''}`,
    quickAnswerChecklist: [
      'Most cases improve with guided, consistent care',
      'No doctor referral needed to book with us',
      'Home visits and online video consultations available',
      'Every physiotherapist is verified and council-registered',
    ],
    aboutText: symptom.treatment
      ? `${symptom.description ?? ''} Physiotherapy fits into recovery by addressing the root cause rather than masking symptoms — treatment usually combines ${symptom.treatment.charAt(0).toLowerCase() + symptom.treatment.slice(1)}`
      : `${symptom.description ?? ''} A structured physiotherapy plan helps you recover safely while reducing the chance of the problem coming back.`,
    howItHelps: [
      `Hands-on manual therapy to ease ${name.toLowerCase()} pain and stiffness`,
      'A progressive exercise plan rebuilt around your daily routine',
      'Posture and workplace ergonomic advice that stops flare-ups',
      'Guidance on safe lifting, sitting and everyday movement',
      'Strength and mobility work to protect the affected area',
      'Regular progress reviews with the same therapist',
    ],
    commonSigns: signs.length > 0 ? signs : [
      'Pain that worsens with certain movements or positions',
      'Stiffness after rest or long periods of sitting',
      'Reduced range of motion in the affected area',
      'Discomfort during everyday activities',
    ],
    urgentCareSymptoms: [
      'Sudden or severe pain following a fall, accident or injury',
      'Numbness, tingling or weakness that is spreading or getting worse',
      'Loss of bladder or bowel control',
      'Fever alongside significant pain or swelling',
      'Chest pain, breathlessness or dizziness',
    ],
    faqs: [
      {
        question: `How many sessions does ${name.toLowerCase()} need?`,
        answer: symptom.recoveryEstimate
          ? `Most patients see meaningful improvement within ${symptom.recoveryEstimate.toLowerCase()}, typically across 6–12 sessions. Your therapist will give you a personalised timeline after the first assessment.`
          : 'Most patients improve within 6–12 sessions. Your therapist will give you a personalised timeline after the first assessment.',
      },
      {
        question: `Can I get physiotherapy for ${name.toLowerCase()} at home?`,
        answer: 'Yes. Our therapists bring portable equipment to your home, so your entire treatment plan can be completed without travelling to a clinic.',
      },
      {
        question: 'Do I need a doctor referral?',
        answer: 'No referral is needed — you can book directly with any verified physiotherapist on PhysioPrime.',
      },
      {
        question: 'How much does it cost?',
        answer: 'Session fees vary by therapist and mode, typically ranging from ₹400 to ₹2,000 per session. Exact fees are shown on every therapist profile before you book.',
      },
      {
        question: 'What if the pain comes back after treatment?',
        answer: 'Your therapist will give you a maintenance exercise plan designed to prevent recurrence, and you can book follow-up sessions anytime.',
      },
    ],
    relatedConditions: related,
  };
}

// Shared across every condition page — platform-level comparison, not condition-specific
export const COMPARISON_ROWS: { label: string; home: string; online: string }[] = [
  { label: 'Typical fee', home: '₹600 – ₹2,000 / session', online: '₹400 – ₹1,000 / session' },
  { label: 'Exact fee', home: 'Shown on each profile', online: 'Shown on each profile' },
  { label: 'Best for', home: 'Hands-on care, post-surgery, mobility-limited patients', online: 'Follow-ups and quick consults without travel' },
  { label: 'Equipment', home: 'Portable kit brought by the therapist', online: 'None needed — video call from home' },
  { label: 'Setup', home: 'Therapist travels to you', online: 'Join a video call anywhere' },
  { label: 'Booking', home: 'Pick a slot & confirm online', online: 'Pick a slot & confirm online' },
];

export const DISCLAIMER_TEXT =
  'The information on this page is general education, not a diagnosis. It does not replace advice from a qualified physiotherapist or doctor. If your symptoms are severe, sudden or worsening, seek urgent medical care first.';
