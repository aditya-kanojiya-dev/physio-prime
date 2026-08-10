export interface SeedDoctor {
  email: string;
  name: string;
  title: string;
  specialty: string;
  slug: string;
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
  gender: string;
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
  phone: string;
}

export const DOCTORS_DATA: SeedDoctor[] = [
  {
    email: 'tarannum@physio.example',
    name: 'Dr. Tarannum Sayyed',
    title: 'Senior Consultant Physiotherapist',
    specialty: 'Orthopedic & Post-Op Rehab Specialist',
    slug: 'doc-tarannum-sayyed',
    photo: 'https://t4.ftcdn.net/jpg/02/57/48/67/360_F_257486764_GnnrHRNIBV93mAwR0aiNkS0x5UjDfIcl.jpg',
    rating: 4.9,
    reviewCount: 142,
    experienceYears: 6,
    patientsTreated: 1250,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Raj Nagar',
      city: 'Nagpur',
      address: 'Suite 402, Healing Touch Rehab Center, Raj Nagar, Nagpur'
    },
    fees: {
      home: 1000,
      online: 599,
      clinic: 800
    },
    nextAvailable: 'Today 03:00 PM',
    verified: true,
    featured: true,
    gender: 'female',
    bio: 'Dr. Tarannum Sayyed is a top-rated Indian physiotherapist with over 6 years of clinical expertise specializing in post-surgical orthopedic rehabilitation, joint mobilization, spine alignment, and chronic lumbar back pain management. She has successfully treated over 1,250 patients across Nagpur.',
    education: [
      'Bachelor of Physiotherapy (BPT) - Maharashtra University of Health Sciences (MUHS)',
      'Master of Physiotherapy (MPT Orthopedics) - KEM Hospital Mumbai',
      'Certified Dry Needling Specialist (CDNP)'
    ],
    experience: [
      {
        role: 'Senior Lead Physiotherapist',
        institution: 'Healing Touch Rehab Center, Nagpur',
        period: '2023 - Present'
      },
      {
        role: 'Clinical Resident Specialist',
        institution: 'Orange City Hospital & Research Institute, Nagpur',
        period: '2020 - 2023'
      }
    ],
    registration: {
      number: '2020/04/8921',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: [
      'Post Knee Replacement Rehabilitation',
      'Lumbar & Cervical Spine Alignment',
      'Myofascial Trigger Point Release',
      'Ergonomic Workstation Assessment'
    ],
    treatments: [
      'Kinesio Taping Therapy',
      'Ultrasound & TENS Therapy',
      'Joint Mobilization (Maitland Technique)',
      'Therapeutic Core Stabilization'
    ],
    phone: ''
  },
  {
    email: 'pritam@physio.example',
    name: 'Dr. Pritam Rathod',
    title: 'Sports & Neurological Rehab Lead',
    specialty: 'Sports Injury & Stroke Rehabilitation',
    slug: 'doc-pritam-rathod',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    rating: 5.0,
    reviewCount: 98,
    experienceYears: 7,
    patientsTreated: 950,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Dharampeth',
      city: 'Nagpur',
      address: 'Dharampeth Sports Medical Care, Main Road, Nagpur'
    },
    fees: {
      home: 899,
      online: 499,
      clinic: 650
    },
    nextAvailable: 'Today 04:30 PM',
    verified: true,
    featured: true,
    gender: 'male',
    bio: 'Dr. Pritam Rathod is an experienced Indian physical therapist specializing in sports injury recovery, hamstring tears, gait retraining, and neurological stroke rehabilitation.',
    education: [
      'BPT - Government Medical College (GMC) Nagpur',
      'Certified Manual Therapist (Maitland & Mulligan)',
      'Diploma in Sports Medicine'
    ],
    experience: [
      {
        role: 'Head Physiotherapist',
        institution: 'Nagpur Sports Care Clinic',
        period: '2021 - Present'
      }
    ],
    registration: {
      number: '2019/09/5542',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: ['ACL Rehab', 'Hamstring Sprain', 'Stroke Hemiplegia', 'Gait Retraining'],
    treatments: ['Dry Needling', 'Cupping Therapy', 'Neuromuscular Electrical Stimulation'],
    phone: ''
  },
  {
    email: 'jayshree@physio.example',
    name: 'Dr. Jayshree Ingole',
    title: 'Women’s Health & Ergonomic Specialist',
    specialty: 'Antenatal & Postnatal Physiotherapy',
    slug: 'doc-jayshree-ingole',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviewCount: 84,
    experienceYears: 5,
    patientsTreated: 780,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Medical Square',
      city: 'Nagpur',
      address: 'Care Women & Physio Hub, Medical Square, Nagpur'
    },
    fees: {
      home: 799,
      online: 449,
      clinic: 550
    },
    nextAvailable: 'Tomorrow 10:00 AM',
    verified: true,
    featured: true,
    gender: 'female',
    bio: 'Dr. Jayshree Ingole provides specialized Indian women’s health physiotherapy, offering gentle home care during pregnancy, pelvic floor strengthening, and postpartum back recovery.',
    education: ['BPT - Nagpur University', 'Post-Graduate Certification in Obstetric Physical Therapy'],
    experience: [
      {
        role: 'Consultant Physio',
        institution: 'Care Women & Physio Hub',
        period: '2022 - Present'
      }
    ],
    registration: {
      number: '2021/11/7109',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: ['Prenatal Back Pain', 'Pelvic Floor Strengthening', 'Diastasis Recti Repair'],
    treatments: ['Pelvic Core Alignment', 'Low Impact Aerobics', 'Postural Correction'],
    phone: ''
  },
  {
    email: 'pratyush@physio.example',
    name: 'Dr. Pratyush Kulkarni',
    title: 'Senior Orthopedic Physio',
    specialty: 'Joint & Vertebral Spine Care',
    slug: 'doc-pratyush-kulkarni',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviewCount: 110,
    experienceYears: 8,
    patientsTreated: 1350,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Ramdaspeth',
      city: 'Nagpur',
      address: 'Central Spine & Joint Center, Ramdaspeth, Nagpur'
    },
    fees: {
      home: 899,
      online: 549,
      clinic: 700
    },
    nextAvailable: 'Today 05:00 PM',
    verified: true,
    featured: false,
    gender: 'male',
    bio: 'Dr. Pratyush Kulkarni has 8 years of clinical practice in non-surgical spinal decompression, sciatica nerve relief, and arthritis pain management in Nagpur.',
    education: ['BPT - MUHS Nashik', 'MPT - Orthopedics'],
    experience: [
      {
        role: 'Chief Physio',
        institution: 'Central Spine Center, Nagpur',
        period: '2018 - Present'
      }
    ],
    registration: {
      number: '2018/02/3310',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: ['Sciatica Relieving', 'Herniated Disc Care', 'Cervical Traction'],
    treatments: ['Spinal Traction', 'Laser Therapy', 'Trigger Point Therapy'],
    phone: ''
  },
  {
    email: 'shubham@physio.example',
    name: 'Dr. Shubham Deshmukh',
    title: 'Senior Occupational & Physical Therapist',
    specialty: 'Hand Rehab & Paralysis Recovery',
    slug: 'doc-shubham-deshmukh',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
    rating: 5.0,
    reviewCount: 125,
    experienceYears: 9,
    patientsTreated: 1550,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Civil Lines',
      city: 'Nagpur',
      address: 'Civil Lines Medical Plaza, Nagpur'
    },
    fees: {
      home: 950,
      online: 599,
      clinic: 750
    },
    nextAvailable: 'Today 02:00 PM',
    verified: true,
    featured: true,
    gender: 'male',
    bio: 'Dr. Shubham Deshmukh is a renowned Indian occupational and physical therapist specializing in hand rehabilitation, carpal tunnel decompression, and fine motor skills recovery.',
    education: ['BPT - Government Medical College Nagpur', 'Certified Hand Therapist (CHT)'],
    experience: [
      {
        role: 'Lead Hand Physio',
        institution: 'Civil Lines Plaza',
        period: '2017 - Present'
      }
    ],
    registration: {
      number: '2017/06/1944',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: ['Carpal Tunnel Syndrome', 'Tendinitis', 'Micro-Hand Splinting'],
    treatments: ['Fine Motor Retraining', 'Custom Splinting', 'Paraffin Wax Bath Therapy'],
    phone: ''
  },
  {
    email: 'ananya@physio.example',
    name: 'Dr. Ananya Sharma',
    title: 'Pediatric & Geriatric Specialist',
    specialty: 'Elderly Mobility & Child Growth',
    slug: 'doc-ananya-sharma',
    photo: 'https://images.unsplash.com/photo-1594824813566-78a99477028b?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviewCount: 104,
    experienceYears: 6,
    patientsTreated: 1100,
    languages: ['Hindi', 'English', 'Marathi'],
    location: {
      area: 'Sadar',
      city: 'Nagpur',
      address: 'Sadar Health & Physio Hub, Nagpur'
    },
    fees: {
      home: 850,
      online: 499,
      clinic: 650
    },
    nextAvailable: 'Tomorrow 11:30 AM',
    verified: true,
    featured: true,
    gender: 'female',
    bio: 'Dr. Ananya Sharma delivers compassionate home physical therapy for senior citizens in Nagpur, focusing on fall prevention, joint stiffness, and pediatric movement therapy.',
    education: ['BPT - MUHS Nashik', 'Certified Geriatric Rehabilitation Specialist'],
    experience: [
      {
        role: 'Consultant Physio',
        institution: 'Sadar Wellness Center',
        period: '2020 - Present'
      }
    ],
    registration: {
      number: '2020/08/4412',
      council: 'Maharashtra State OT/PT Council'
    },
    expertise: ['Elderly Fall Risk', 'Osteoarthritis Care', 'Pediatric Posture Alignment'],
    treatments: ['Balance Board Training', 'Gentle Joint Exercise', 'Reflex Integration'],
    phone: ''
  }
];
