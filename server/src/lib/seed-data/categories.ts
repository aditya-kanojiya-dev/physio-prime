export interface SeedCategory {
  title: string;
  slug: string;
  description: string;
  image: string;
  color: string;
  conditions: string[];
}

export const CATEGORIES_DATA: SeedCategory[] = [
  {
    title: 'Orthopedic Doctor',
    slug: 'orthopedic',
    description: 'Specialized therapy for bones, joints, ligaments, tendons, and post-surgical bone recovery.',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    conditions: ['Back Pain', 'Neck Pain', 'Sciatica', 'Frozen Shoulder', 'Knee Osteoarthritis', 'Spondylosis'],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    title: 'Sports Injury Doctor',
    slug: 'sports-injury',
    description: 'High-performance sports medicine, kinesio taping, dry needling, and explosive recovery.',
    image: 'https://www.mindinventory.com/blog/wp-content/uploads/2025/05/ai-driven-injury-prevention-in-sports.webp',
    conditions: ['ACL Tear', 'Rotator Cuff Injury', 'Tennis Elbow', 'Ankle Sprain', 'Stress Fracture', 'Hamstring Strain'],
    color: 'from-blue-600 to-cyan-500'
  },
  {
    title: 'Neurological Doctor',
    slug: 'neurological',
    description: 'Expert care for nerve disorders, stroke rehabilitation, Parkinson’s, and spinal cord injuries.',
    image: 'https://wellknox.com/wp-content/uploads/2022/12/Neuro-rehabilitation.webp',
    conditions: ['Stroke', "Parkinson's Disease", 'Multiple Sclerosis (MS)', 'Spinal Cord Injury', 'Cerebral Palsy', 'Traumatic Brain Injury'],
    color: 'from-cyan-500 to-blue-600'
  },
  {
    title: 'Pediatric Doctor',
    slug: 'pediatrics',
    description: 'Gentle, play-based physical therapy for developmental delays, cerebral palsy, and posture.',
    image: 'https://neurogenbsi.com/assets/frontend/images/physiotherapy/weoffer/06_we_offer_physiotherapy_for_global_developmental_disorders_paediatric.jpg',
    conditions: ['Cerebral Palsy in Children', 'Developmental Delay', 'Muscular Dystrophy', 'Infant Torticollis', 'Scoliosis in Children', 'Coordination Difficulties in Children'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    title: 'Cardio Doctor',
    slug: 'cardio-pulmonary',
    description: 'Lung capacity building, post-COVID respiratory recovery, and cardiac endurance training.',
    image: 'https://winnparishmedical.ahmgt.com/wp-content/uploads/2022/11/RespiratoryTherapyImage.jpg',
    conditions: ['COPD', 'Post-COVID Recovery', 'Asthma', 'Post-CABG Rehabilitation', 'Bronchiectasis', 'ICU Recovery'],
    color: 'from-teal-500 to-emerald-600'
  },
  {
    title: 'Geriatric Doctor',
    slug: 'geriatric',
    description: 'Specialized elderly mobility enhancement, fall prevention, and gentle arthritis relief.',
    image: 'https://ppreddyretirementhomes.org/wp-content/uploads/2025/08/Geriatricrehabmobile2-1024x616.jpg',
    conditions: ['Osteoporosis', 'Balance Disorders', 'Fall Prevention', 'Hip Fracture Rehabilitation', 'Age-Related Deconditioning', 'Knee and Hip Arthritis'],
    color: 'from-sky-500 to-indigo-500'
  },
  {
    title: "Women's Health",
    slug: 'womens-health',
    description: 'Pre and post-natal pelvic floor strengthening, diastasis recti, and posture correction.',
    image: 'https://bendandmend.com.au/wp-content/uploads/2024/02/Stephanie-kyrgias-blog-pelvic-womens-health-physio.jpg',
    conditions: ['Pelvic Girdle Pain', 'Back Pain in Pregnancy', 'Diastasis Recti', 'Postnatal Core Weakness', 'Symphysis Pubis Dysfunction', 'Swelling in Pregnancy', 'Urinary Incontinence', 'Pelvic Organ Prolapse', 'Chronic Pelvic Pain', 'Painful Intercourse (Dyspareunia)', 'Vaginismus', 'Faecal Incontinence'],
    color: 'from-purple-500 to-pink-500'
  },
];