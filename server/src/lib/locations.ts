// Fixed set of neighborhoods PhysioPrime serves home visits in.
// Single source of truth for the patient location dropdown and the
// doctor's "locations I'm comfortable visiting" toggles.
export const SERVICE_AREAS = [
  'Dharampeth',
  'Dhantoli',
  'Civil Lines',
  'Sadar',
  'Wardha Road',
  'Itwari',
  'Ramdaspeth',
  'Bajaj Nagar',
  'Ganesh Peth',
  'Laxmi Nagar',
  'Manish Nagar',
  'Nandanvan',
  'Besa',
  'Sonegaon',
  'Panchpaoli',
  'Koradi',
] as const;

// Online video consultations are available anywhere in the country.
export const PAN_INDIA = 'Pan-India';

// Cities PhysioPrime serves, mapped to the neighborhoods available for home
// visits in each city. Pan-India has no areas (online-only).
export const SERVICE_CITIES: { name: string; areas: readonly string[] }[] = [
  { name: 'Nagpur', areas: SERVICE_AREAS },
  { name: PAN_INDIA, areas: [] },
];

export const NAGPUR = 'Nagpur';
