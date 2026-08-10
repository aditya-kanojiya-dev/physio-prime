import { Category } from '../types';

export const CATEGORIES_DATA: Category[] = [
  {
    id: 'orthopedic',
    title: 'Orthopedic Physiotherapy',
    slug: 'orthopedic',
    description: 'Specialized therapy for bones, joints, ligaments, tendons, and post-surgical bone recovery.',
    doctorCount: 42,
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    conditions: ['Back & Neck Pain', 'Knee Replacement', 'Fractures', 'Sprains & Strains', 'Scoliosis'],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'neurological',
    title: 'Neurological Rehabilitation',
    slug: 'neurological',
    description: 'Expert care for nerve disorders, stroke rehabilitation, Parkinson’s, and spinal cord injuries.',
    doctorCount: 28,
    image: 'https://wellknox.com/wp-content/uploads/2022/12/Neuro-rehabilitation.webp',
    conditions: ['Stroke Hemiplegia', 'Parkinsonism', 'Multiple Sclerosis', 'Facial Palsy', 'Neuropathy'],
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'cardio-pulmonary',
    title: 'Cardio-Pulmonary Therapy',
    slug: 'cardio-pulmonary',
    description: 'Lung capacity building, post-COVID respiratory recovery, and cardiac endurance training.',
    doctorCount: 19,
    image: 'https://winnparishmedical.ahmgt.com/wp-content/uploads/2022/11/RespiratoryTherapyImage.jpg',
    conditions: ['Post-COVID Lungs', 'COPD Management', 'Asthma Breathing', 'Post Bypass Rehab'],
    color: 'from-teal-500 to-emerald-600'
  },
  {
    id: 'sports-injury',
    title: 'Sports Injury & Performance',
    slug: 'sports-injury',
    description: 'High-performance sports medicine, kinesio taping, dry needling, and explosive recovery.',
    doctorCount: 35,
    image: 'https://www.mindinventory.com/blog/wp-content/uploads/2025/05/ai-driven-injury-prevention-in-sports.webp',
    conditions: ['Rotator Cuff', 'Tennis Elbow', 'Runner Knee', 'ACL Tears', 'Shin Splints'],
    color: 'from-blue-600 to-cyan-500'
  },
  {
    id: 'womens-health',
    title: "Women's Health Physiotherapy",
    slug: 'womens-health',
    description: 'Pre and post-natal pelvic floor strengthening, diastasis recti, and posture correction.',
    doctorCount: 22,
    image: 'https://bendandmend.com.au/wp-content/uploads/2024/02/Stephanie-kyrgias-blog-pelvic-womens-health-physio.jpg',
    conditions: ['Antenatal Exercise', 'Pelvic Floor Rehab', 'Postpartum Back Pain', 'Diastasis Recti'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'pediatrics',
    title: 'Pediatric Physiotherapy',
    slug: 'pediatrics',
    description: 'Gentle, play-based physical therapy for developmental delays, cerebral palsy, and posture.',
    doctorCount: 16,
    image: 'https://neurogenbsi.com/assets/frontend/images/physiotherapy/weoffer/06_we_offer_physiotherapy_for_global_developmental_disorders_paediatric.jpg',
    conditions: ['Cerebral Palsy', 'Developmental Delay', 'Torticollis', 'Clubfoot Management'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'geriatric',
    title: 'Geriatric Rehabilitation',
    slug: 'geriatric',
    description: 'Specialized elderly mobility enhancement, fall prevention, and gentle arthritis relief.',
    doctorCount: 31,
    image: 'https://ppreddyretirementhomes.org/wp-content/uploads/2025/08/Geriatricrehabmobile2-1024x616.jpg',
    conditions: ['Fall Risk Reduction', 'Osteoporosis Care', 'Balance Deficits', 'Joint Stiffness'],
    color: 'from-sky-500 to-indigo-500'
  },
  {
    id: 'hand-rehab',
    title: 'Hand & Micro-Rehabilitation',
    slug: 'hand-rehab',
    description: 'Finger dexterity, nerve gliding, wrist splinting, and precise tendon recovery.',
    doctorCount: 14,
    image: 'https://www.healwithlaser.com.au/wp-content/uploads/2024/02/Hand-therapy.png',
    conditions: ['Carpal Tunnel', 'Trigger Finger', 'Wrist Fracture', 'De Quervain Strain'],
    color: 'from-teal-600 to-blue-500'
  },
  {
    id: 'psychiatry-mindbody',
    title: 'Psychosomatic & Ergonomic Care',
    slug: 'psychiatry-mindbody',
    description: 'Stress-induced muscle spasms, postural ergonomic alignment, and somatic relief.',
    doctorCount: 18,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGsr46vVpNgAzjHFZmKgqLEQj9SN8i2l6qaGV3CHzLC6G9xuksKHjyh30&s=10',
    conditions: ['Tension Headaches', 'Fibromyalgia', 'Ergonomic Desk Strain', 'Somatic Spasms'],
    color: 'from-indigo-500 to-purple-600'
  }
];
