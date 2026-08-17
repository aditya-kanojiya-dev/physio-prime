import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/pool';
import { runMigrations } from '../db/migrate';
import { appointments, categories, communityCategories, communityPosts, communityReplies, communityVotes, conversations, doctorApplications, doctorLocations, doctorNotifications, doctorPayouts, doctors, doctorSchedules, messages, patientProfiles, prescriptions, reviews, symptoms, users } from '../db/schema';
import { CATEGORIES_DATA } from './seed-data/categories';
import { SYMPTOMS_DATA } from './seed-data/symptoms';
import { DOCTORS_DATA } from './seed-data/doctors';

// ponytail: truncates users too so dev seed stays idempotent; drop `users` from
// this list once real registrations land in later phases.
export async function seed(): Promise<void> {
  await db.execute(
    sql`TRUNCATE users, doctors, doctor_applications, categories, symptoms, patient_profiles, appointments, reviews, prescriptions, community_categories, doctor_locations, doctor_payouts, community_posts, community_replies, community_votes, conversations, messages, doctor_notifications RESTART IDENTITY CASCADE`,
  );

  const passwordHash = bcrypt.hashSync('physio123', 10);

  const insertedUsers = await db
    .insert(users)
    .values(
      DOCTORS_DATA.map((d) => ({
        email: d.email,
        passwordHash,
        role: 'doctor',
        name: d.name,
        phone: d.phone || null,
      })),
    )
    .returning({ id: users.id });

  await db
    .insert(users)
    .values({
      email: 'admin@physio.example',
      passwordHash,
      role: 'admin',
      name: 'Platform Admin',
    })
    .returning({ id: users.id });

  const insertedDoctors = await db
    .insert(doctors)
    .values(
      DOCTORS_DATA.map((d, i) => ({
        userId: insertedUsers[i].id,
        name: d.name,
        title: d.title,
        specialty: d.specialty,
        slug: d.slug,
        photo: d.photo,
        rating: String(d.rating),
        reviewCount: d.reviewCount,
        experienceYears: d.experienceYears,
        patientsTreated: d.patientsTreated,
        languages: d.languages,
        location: d.location,
        fees: d.fees,
        nextAvailable: nextDate(d.nextAvailable),
        verified: d.verified,
        featured: d.featured,
        gender: d.gender,
        bio: d.bio,
        education: d.education,
        experience: d.experience,
        registration: d.registration,
        expertise: d.expertise,
        treatments: d.treatments,
      })),
    )
    .returning({ id: doctors.id });

  await db.insert(doctorSchedules).values(
    insertedDoctors.flatMap((d) =>
      Array.from({ length: 6 }, (_, i) => i + 1).map((dayOfWeek) => ({
        doctorId: d.id,
        dayOfWeek,
        startTime: '07:00',
        endTime: '21:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        active: true,
      })),
    ),
  );

  await db.insert(doctorApplications).values(
    DOCTORS_DATA.map((_, i) => ({
      userId: insertedUsers[i].id,
      status: 'approved',
    })),
  );

  await seedShowcase(insertedDoctors);

  await db.insert(categories).values(CATEGORIES_DATA);
  await db.insert(symptoms).values(SYMPTOMS_DATA);

  await db.insert(communityCategories).values([
    { name: 'General Medicine', slug: 'general-medicine', description: 'General medical discussions', sortOrder: 0 },
    { name: 'Physiotherapy', slug: 'physiotherapy', description: 'Physiotherapy techniques and cases', sortOrder: 1 },
    { name: 'Orthopedics', slug: 'orthopedics', description: 'Bone and joint related discussions', sortOrder: 2 },
    { name: 'Pediatrics', slug: 'pediatrics', description: 'Pediatric physiotherapy', sortOrder: 3 },
    { name: 'Dermatology', slug: 'dermatology', description: 'Skin-related physiotherapy topics', sortOrder: 4 },
    { name: 'Mental Health', slug: 'mental-health', description: 'Mental health and physiotherapy', sortOrder: 5 },
    { name: 'Nutrition', slug: 'nutrition', description: 'Nutrition for recovery and wellness', sortOrder: 6 },
    { name: 'Clinical Discussions', slug: 'clinical-discussions', description: 'Clinical case discussions', sortOrder: 7 },
    { name: 'Practice Management', slug: 'practice-management', description: 'Running and growing a practice', sortOrder: 8 },
    { name: 'Technology', slug: 'technology', description: 'Health tech and tools', sortOrder: 9 },
    { name: 'General Discussion', slug: 'general-discussion', description: 'Off-topic and casual chat', sortOrder: 10 },
  ]);

  // Seed doctor locations for each doctor
  const nagpurAreas = ['Dharampeth', 'Wardha Road', 'Civil Lines', 'Sadar', 'Itwari', 'Dhantoli'];
  await db.insert(doctorLocations).values(
    insertedDoctors.flatMap((d, i) => [
      {
        doctorId: d.id,
        name: `${d.id <= 3 ? 'Clinic' : 'Home Office'} - Main`,
        address: `${100 + i * 10}, Main Road`,
        area: nagpurAreas[i % nagpurAreas.length],
        city: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440001',
        lat: String(21.14 + (i * 0.01)),
        lng: String(79.08 + (i * 0.01)),
        radiusKm: '10',
        isPrimary: true,
        active: true,
      },
      ...(i < 3 ? [{
        doctorId: d.id,
        name: `Satellite Office`,
        address: `${200 + i * 10}, Ring Road`,
        area: nagpurAreas[(i + 2) % nagpurAreas.length],
        city: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440002',
        lat: String(21.12 + (i * 0.01)),
        lng: String(79.10 + (i * 0.01)),
        radiusKm: '5',
        isPrimary: false,
        active: true,
      }] : []),
    ]),
  );

  // Seed doctor payouts (some completed, some pending)
  await db.insert(doctorPayouts).values(
    insertedDoctors.slice(0, 4).flatMap((d) => [
      {
        doctorId: d.id,
        amountPaise: 1500000, // ₹15,000
        status: 'completed',
        paymentMethod: 'bank_transfer',
        transactionId: `TXN${d.id}001`,
        notes: 'Monthly payout',
        processedAt: new Date(),
      },
      {
        doctorId: d.id,
        amountPaise: 800000, // ₹8,000
        status: 'pending',
        paymentMethod: 'upi',
        transactionId: null,
        notes: 'Pending processing',
        processedAt: null,
      },
    ]),
  );

  // Seed community posts
  const insertedPosts = await db.insert(communityPosts).values([
    {
      doctorId: insertedDoctors[0].id,
      categoryId: 1,
      title: 'Best practices for post-op knee rehab',
      body: 'I have been seeing patients who undergo ACL reconstruction and I want to share my protocol for early rehabilitation. What are your thoughts on weight-bearing status in the first 2 weeks?',
      tags: ['physiotherapy', 'rehabilitation', 'knee'],
      replyCount: 0,
      voteCount: 12,
      viewCount: 156,
      pinned: false,
      closed: false,
    },
    {
      doctorId: insertedDoctors[1].id,
      categoryId: 2,
      title: 'Managing chronic low back pain - evidence update',
      body: 'Recent systematic reviews suggest that exercise therapy should be first-line treatment for chronic LBP. How do you structure your exercise programs?',
      tags: ['physiotherapy', 'evidence-based', 'pain'],
      replyCount: 0,
      voteCount: 8,
      viewCount: 89,
      pinned: false,
      closed: false,
    },
    {
      doctorId: insertedDoctors[2].id,
      categoryId: 9,
      title: 'Tips for growing your physio practice',
      body: 'After 10 years in practice, here are some things that worked for me: building relationships with referring physicians, offering home visits, and using social media for patient education.',
      tags: ['practice-management', 'growth'],
      replyCount: 0,
      voteCount: 15,
      viewCount: 203,
      pinned: true,
      closed: false,
    },
  ]).returning({ id: communityPosts.id });

  // Seed some community replies
  await db.insert(communityReplies).values([
    {
      postId: insertedPosts[0].id,
      doctorId: insertedDoctors[1].id,
      body: 'Great topic! I typically allow weight-bearing as tolerated from day 1 with crutches. Early ROM is key.',
      voteCount: 5,
      accepted: false,
      parentId: null,
    },
    {
      postId: insertedPosts[0].id,
      doctorId: insertedDoctors[2].id,
      body: 'I agree with the early weight-bearing approach. I also add pool therapy in week 2 for better outcomes.',
      voteCount: 3,
      accepted: true,
      parentId: null,
    },
    {
      postId: insertedPosts[1].id,
      doctorId: insertedDoctors[0].id,
      body: 'McKenzie method works well for me. Patient education is crucial for self-management.',
      voteCount: 7,
      accepted: false,
      parentId: null,
    },
  ]);

  // Seed a conversation and messages
  const [conversation] = await db.insert(conversations).values({
    doctor1Id: insertedDoctors[0].id,
    doctor2Id: insertedDoctors[1].id,
    lastMessage: 'Thanks for the referral!',
    lastMessageAt: new Date(),
  }).returning({ id: conversations.id });

  await db.insert(messages).values([
    {
      conversationId: conversation.id,
      senderId: insertedDoctors[0].id,
      body: 'Hi Dr. Sharma, I have a patient who might benefit from your expertise in sports injuries.',
      read: true,
    },
    {
      conversationId: conversation.id,
      senderId: insertedDoctors[1].id,
      body: 'Thanks for the referral! I will take a look at the records.',
      read: true,
    },
  ]);

  // Seed doctor notifications
  await db.insert(doctorNotifications).values([
    {
      doctorId: insertedDoctors[0].id,
      type: 'payment',
      title: 'Payment received',
      body: 'You received ₹500 from patient Ravi Kumar',
      link: '/payments',
      read: false,
    },
    {
      doctorId: insertedDoctors[0].id,
      type: 'community',
      title: 'New reply on your post',
      body: 'Dr. Mehta replied to "Best practices for post-op knee rehab"',
      link: '/community/1',
      read: false,
    },
    {
      doctorId: insertedDoctors[0].id,
      type: 'message',
      title: 'New message from Dr. Sharma',
      body: 'Thanks for the referral!',
      link: '/messages',
      read: true,
    },
  ]);
}

interface DemoPatient {
  email: string;
  name: string;
  phone: string;
  gender: 'male' | 'female';
  dob: string;
  age: number;
  weight: string;
  height: string;
  address: Record<string, string>;
}

const DEMO_PATIENTS = {
  ravi: {
    email: 'ravi@physio.example',
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
    gender: 'male',
    dob: '1990-06-15',
    age: 34,
    weight: '78',
    height: '178',
    address: { text: 'A-402, Green Meadows, Wardha Road, Nagpur' },
  },
  priya: {
    email: 'priya@physio.example',
    name: 'Priya Sharma',
    phone: '+91 91234 56789',
    gender: 'female',
    dob: '1995-02-20',
    age: 29,
    weight: '62',
    height: '162',
    address: { text: 'B-12, Sai Residency, Dharampeth, Nagpur' },
  },
  kavita: {
    email: 'kavita@physio.example',
    name: 'Kavita Patel',
    phone: '+91 99887 76543',
    gender: 'female',
    dob: '1985-03-22',
    age: 41,
    weight: '58',
    height: '158',
    address: { text: 'C-8, Laxmi Nagar, Amravati Road, Nagpur' },
  },
  amit: {
    email: 'amit@physio.example',
    name: 'Amit Verma',
    phone: '+91 90909 88776',
    gender: 'male',
    dob: '1999-07-11',
    age: 27,
    weight: '72',
    height: '175',
    address: { text: 'D-45, Shankar Nagar, Nagpur' },
  },
  sneha: {
    email: 'sneha@physio.example',
    name: 'Sneha Reddy',
    phone: '+91 96543 21098',
    gender: 'female',
    dob: '1993-01-08',
    age: 33,
    weight: '55',
    height: '160',
    address: { text: 'E-21, Ravi Nagar, Nagpur' },
  },
  mohan: {
    email: 'mohan@physio.example',
    name: 'Mohan Gupta',
    phone: '+91 93456 78901',
    gender: 'male',
    dob: '1974-11-30',
    age: 52,
    weight: '85',
    height: '170',
    address: { text: 'F-3, Manish Nagar, Wardha Road, Nagpur' },
  },
  fatima: {
    email: 'fatima@physio.example',
    name: 'Fatima Khan',
    phone: '+91 97890 12345',
    gender: 'female',
    dob: '1988-09-14',
    age: 38,
    weight: '64',
    height: '165',
    address: { text: 'G-17, Mominpura, Mahal, Nagpur' },
  },
} as const satisfies Record<string, DemoPatient>;

// ponytail: doctor index = position in DOCTORS_DATA; dates are offsets from today
// so upcoming/completed always look right when the seed is (re)run.
interface AppointmentSpec {
  bookingId: string;
  doctor: number;
  patient: keyof typeof DEMO_PATIENTS;
  mode: 'home' | 'online' | 'clinic';
  days: number;
  slot: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  symptom: string;
  feePaise: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  relation?: string;
}

const APPOINTMENT_SPECS: AppointmentSpec[] = [
  { bookingId: 'APT-100001', doctor: 0, patient: 'ravi', mode: 'home', days: 0, slot: '11:00-11:45', status: 'upcoming', symptom: 'Lower back pain after lifting weights', feePaise: 100000, paymentStatus: 'paid' },
  { bookingId: 'APT-100002', doctor: 1, patient: 'ravi', mode: 'online', days: 2, slot: '16:00-16:45', status: 'upcoming', symptom: 'Knee pain after running', feePaise: 49900, paymentStatus: 'paid' },
  { bookingId: 'APT-100003', doctor: 4, patient: 'ravi', mode: 'clinic', days: 4, slot: '10:00-10:45', status: 'upcoming', symptom: 'Wrist pain from long hours of typing', feePaise: 75000, paymentStatus: 'pending' },
  { bookingId: 'APT-100004', doctor: 0, patient: 'ravi', mode: 'home', days: -6, slot: '18:00-18:45', status: 'completed', symptom: 'Chronic shoulder stiffness', feePaise: 100000, paymentStatus: 'paid' },
  { bookingId: 'APT-100005', doctor: 5, patient: 'ravi', mode: 'online', days: -13, slot: '09:00-09:45', status: 'completed', symptom: 'Post-fracture wrist stiffness', feePaise: 49900, paymentStatus: 'paid', relation: 'mother' },
  { bookingId: 'APT-100006', doctor: 3, patient: 'ravi', mode: 'clinic', days: -20, slot: '17:00-17:45', status: 'completed', symptom: 'Sciatica pain in left leg', feePaise: 70000, paymentStatus: 'paid' },
  { bookingId: 'APT-100007', doctor: 2, patient: 'ravi', mode: 'clinic', days: -8, slot: '15:00-15:45', status: 'cancelled', symptom: 'Postpartum back pain', feePaise: 55000, paymentStatus: 'refunded' },
  { bookingId: 'APT-100008', doctor: 2, patient: 'priya', mode: 'home', days: -3, slot: '10:00-10:45', status: 'completed', symptom: 'Pregnancy-related pelvic girdle pain', feePaise: 79900, paymentStatus: 'paid' },
  { bookingId: 'APT-100009', doctor: 1, patient: 'priya', mode: 'clinic', days: -10, slot: '18:30-19:15', status: 'completed', symptom: 'Hamstring strain while sprinting', feePaise: 65000, paymentStatus: 'paid' },
  { bookingId: 'APT-100010', doctor: 4, patient: 'priya', mode: 'home', days: 3, slot: '17:00-17:45', status: 'upcoming', symptom: 'Carpal tunnel discomfort', feePaise: 95000, paymentStatus: 'paid' },
  { bookingId: 'APT-100011', doctor: 5, patient: 'kavita', mode: 'online', days: -4, slot: '11:30-12:15', status: 'completed', symptom: 'Chronic neck pain and stiffness', feePaise: 49900, paymentStatus: 'paid' },
  { bookingId: 'APT-100012', doctor: 2, patient: 'kavita', mode: 'home', days: 1, slot: '16:00-16:45', status: 'upcoming', symptom: 'Lower back pain during pregnancy', feePaise: 79900, paymentStatus: 'paid' },
  { bookingId: 'APT-100013', doctor: 1, patient: 'amit', mode: 'clinic', days: -2, slot: '12:00-12:45', status: 'completed', symptom: 'Ankle sprain while playing football', feePaise: 65000, paymentStatus: 'paid' },
  { bookingId: 'APT-100014', doctor: 3, patient: 'amit', mode: 'clinic', days: 5, slot: '19:00-19:45', status: 'upcoming', symptom: 'Cervical disc pain', feePaise: 70000, paymentStatus: 'pending' },
  { bookingId: 'APT-100015', doctor: 4, patient: 'sneha', mode: 'home', days: -7, slot: '09:00-09:45', status: 'completed', symptom: 'Shoulder impingement from gym', feePaise: 95000, paymentStatus: 'paid' },
  { bookingId: 'APT-100016', doctor: 0, patient: 'sneha', mode: 'clinic', days: 2, slot: '18:00-18:45', status: 'upcoming', symptom: 'Tennis elbow', feePaise: 80000, paymentStatus: 'paid' },
  { bookingId: 'APT-100017', doctor: 3, patient: 'mohan', mode: 'clinic', days: -15, slot: '11:00-11:45', status: 'completed', symptom: 'Knee osteoarthritis', feePaise: 70000, paymentStatus: 'paid' },
  { bookingId: 'APT-100018', doctor: 5, patient: 'mohan', mode: 'home', days: -9, slot: '14:00-14:45', status: 'completed', symptom: 'Stiffness after hip replacement', feePaise: 85000, paymentStatus: 'paid' },
  { bookingId: 'APT-100019', doctor: 1, patient: 'mohan', mode: 'online', days: 6, slot: '10:00-10:45', status: 'upcoming', symptom: 'Balance issues after stroke', feePaise: 49900, paymentStatus: 'pending' },
  { bookingId: 'APT-100020', doctor: 2, patient: 'fatima', mode: 'home', days: -11, slot: '17:30-18:15', status: 'completed', symptom: 'Diastasis recti recovery', feePaise: 79900, paymentStatus: 'paid' },
  { bookingId: 'APT-100021', doctor: 0, patient: 'fatima', mode: 'clinic', days: 3, slot: '12:00-12:45', status: 'upcoming', symptom: 'Migraine with neck tension', feePaise: 80000, paymentStatus: 'paid' },
  { bookingId: 'APT-100022', doctor: 5, patient: 'fatima', mode: 'online', days: -18, slot: '15:00-15:45', status: 'completed', symptom: 'Posture correction', feePaise: 49900, paymentStatus: 'paid', relation: 'mother' },
];

async function seedShowcase(insertedDoctors: { id: number }[]): Promise<void> {
  const passwordHash = bcrypt.hashSync('physio123', 10);

  const patients = await db
    .insert(users)
    .values(
      Object.values(DEMO_PATIENTS).map((p) => ({
        email: p.email,
        passwordHash,
        role: 'patient',
        name: p.name,
        phone: p.phone,
      })),
    )
    .returning({ id: users.id, email: users.email });
  const patientId = (email: string) => patients.find((p) => p.email === email)!.id;

  await db.insert(patientProfiles).values(
    Object.values(DEMO_PATIENTS).map((p) => ({
      userId: patientId(p.email),
      gender: p.gender,
      dob: p.dob,
      weight: p.weight,
      height: p.height,
      address: p.address,
    })),
  );

  const rows = await db
    .insert(appointments)
    .values(
      APPOINTMENT_SPECS.map((a) => {
        const p = DEMO_PATIENTS[a.patient];
        return {
          bookingId: a.bookingId,
          patientId: patientId(p.email),
          doctorId: insertedDoctors[a.doctor].id,
          mode: a.mode,
          date: shiftDate(a.days),
          timeSlot: a.slot,
          status: a.status,
          symptom: a.symptom,
          feePaise: a.feePaise,
          address: p.address,
          paymentStatus: a.paymentStatus,
          patientName: p.name,
          patientPhone: p.phone,
          patientEmail: p.email,
          patientGender: p.gender,
          patientAge: p.age,
          patientWeight: p.weight,
          patientHeight: p.height,
          patientRelation: a.relation ?? null,
          videoCallLink: a.mode === 'online' ? `https://meet.physioprime.in/${a.bookingId}` : null,
          cancellationReason: a.status === 'cancelled' ? 'Schedule conflict at work' : null,
        };
      }),
    )
    .returning({ id: appointments.id, bookingId: appointments.bookingId, doctorId: appointments.doctorId });

  const byBooking = new Map(rows.map((r) => [r.bookingId, r]));

  const REVIEWS: Record<string, { rating: number; comment: string }> = {
    'APT-100004': { rating: 5, comment: 'Dr. Tarannum is incredibly thorough. My shoulder feels better after just three sessions. Highly recommended.' },
    'APT-100005': { rating: 5, comment: 'Very patient and gentle with my elderly mother. The exercises were easy to follow even over video.' },
    'APT-100006': { rating: 4, comment: 'Felt immediate relief from the sciatica pain. Slightly long wait at the clinic, but worth it.' },
    'APT-100008': { rating: 5, comment: 'So reassuring during my pregnancy. She explained everything clearly and the pain is gone.' },
    'APT-100009': { rating: 5, comment: 'Got me back on the track within two weeks. Clear rehab plan and great follow-up.' },
    'APT-100011': { rating: 5, comment: 'The video session was surprisingly effective. My desk-work neck pain is finally manageable.' },
    'APT-100013': { rating: 4, comment: 'Back on the field in three weeks. Detailed plan and very encouraging throughout.' },
    'APT-100015': { rating: 5, comment: 'Came home with all the equipment needed. My shoulder feels stronger than before the injury.' },
    'APT-100017': { rating: 5, comment: 'Very patient with my knee. The exercises eased my pain far more than the injections did.' },
    'APT-100018': { rating: 4, comment: 'Great home rehab after my hip surgery. My mobility has improved noticeably.' },
    'APT-100020': { rating: 5, comment: 'Kind, knowledgeable and so supportive. My core feels much stronger now.' },
    'APT-100022': { rating: 5, comment: 'Wonderful with my mother. She actually looks forward to the sessions now.' },
  };

  await db.insert(reviews).values(
    Object.entries(REVIEWS).map(([bookingId, r]) => ({
      appointmentId: byBooking.get(bookingId)!.id,
      doctorId: byBooking.get(bookingId)!.doctorId,
      rating: r.rating,
      comment: r.comment,
    })),
  );

  const PRESCRIPTIONS: Record<string, { diagnosis: string; medicines: { name: string; dosage: string; frequency: string; duration: string }[]; advice: string; followUpDays: number }> = {
    'APT-100004': {
      diagnosis: 'Acute lumbar strain with mild muscle spasm',
      medicines: [
        { name: 'Tizan 2mg', dosage: '2mg', frequency: 'Once at night', duration: '5 days' },
        { name: 'Combiflam', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '3 days' },
      ],
      advice: 'Apply ice pack 15 min thrice daily. Avoid lifting heavy objects for a week. Start gentle pelvic tilts from day 3.',
      followUpDays: 7,
    },
    'APT-100005': {
      diagnosis: 'Post-fracture wrist stiffness (distal radius)',
      medicines: [
        { name: 'Calcium-D3', dosage: '1 tablet', frequency: 'Once daily', duration: '4 weeks' },
        { name: 'Vitamin C', dosage: '500mg', frequency: 'Once daily', duration: '4 weeks' },
      ],
      advice: 'Daily wrist range-of-motion exercises as demonstrated. Warm compress before sessions.',
      followUpDays: 14,
    },
    'APT-100006': {
      diagnosis: 'Sciatica secondary to disc bulge L4-L5',
      medicines: [{ name: 'Ultraproct 4mg', dosage: '4mg', frequency: 'Once daily', duration: '7 days' }],
      advice: 'Avoid sitting for more than 30 minutes continuously. Use a lumbar roll while driving.',
      followUpDays: 10,
    },
    'APT-100008': {
      diagnosis: 'Pregnancy-related pelvic girdle pain',
      medicines: [{ name: 'Calcium', dosage: '1 tablet', frequency: 'Once daily', duration: '6 weeks' }],
      advice: 'Prenatal core exercises twice daily. Sleep on the left side with a pillow between knees.',
      followUpDays: 21,
    },
    'APT-100009': {
      diagnosis: 'Grade 1 hamstring strain',
      medicines: [{ name: 'Tramazac', dosage: '50mg', frequency: 'Twice daily', duration: '5 days' }],
      advice: 'RICE protocol for 48 hours. Begin gentle hamstring stretching from day 3.',
      followUpDays: 7,
    },
    'APT-100011': {
      diagnosis: 'Chronic myofascial neck pain (C5-C6)',
      medicines: [{ name: 'Gabapin NT', dosage: '1 tablet', frequency: 'Once at night', duration: '10 days' }],
      advice: 'Ergonomic desk setup as discussed. Neck rolls every 45 minutes during work.',
      followUpDays: 14,
    },
    'APT-100013': {
      diagnosis: 'Grade 2 ankle sprain (lateral ligament)',
      medicines: [{ name: 'Brufen 400', dosage: '1 tablet', frequency: 'Thrice daily after food', duration: '5 days' }],
      advice: 'Continue RICE for 72 hours. Begin ankle mobility exercises from day 4.',
      followUpDays: 7,
    },
    'APT-100015': {
      diagnosis: 'Subacromial shoulder impingement',
      medicines: [{ name: 'Zerodol-SP', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '5 days' }],
      advice: 'Ice pack 15 min after each session. Avoid overhead lifting for 2 weeks.',
      followUpDays: 10,
    },
    'APT-100017': {
      diagnosis: 'Moderate knee osteoarthritis (grade 2)',
      medicines: [
        { name: 'Glucosamine', dosage: '1 tablet', frequency: 'Once daily', duration: '8 weeks' },
        { name: 'Ecodipine', dosage: '1 tablet', frequency: 'Once at night', duration: '2 weeks' },
      ],
      advice: 'Quadriceps strengthening daily. Use a walking stick on long walks.',
      followUpDays: 21,
    },
    'APT-100018': {
      diagnosis: 'Post-hip-replacement stiffness',
      medicines: [{ name: 'Shelcal', dosage: '1 tablet', frequency: 'Once daily', duration: '6 weeks' }],
      advice: 'Home exercises twice daily as demonstrated. Avoid bending past 90 degrees.',
      followUpDays: 14,
    },
    'APT-100020': {
      diagnosis: 'Diastasis recti with mild core weakness',
      medicines: [{ name: 'D3 60K', dosage: '1 sachet', frequency: 'Once weekly', duration: '4 weeks' }],
      advice: 'Core activation breathing exercises twice daily. No crunches or planks yet.',
      followUpDays: 28,
    },
    'APT-100022': {
      diagnosis: 'Postural kyphosis with thoracic tightness',
      medicines: [{ name: 'Pan D', dosage: '1 tablet', frequency: 'Once daily', duration: '1 week' }],
      advice: 'Wall posture exercises twice daily. Reduce phone use in bed.',
      followUpDays: 14,
    },
  };

  const patientOf = (bookingId: string) => patientId(DEMO_PATIENTS[APPOINTMENT_SPECS.find((a) => a.bookingId === bookingId)!.patient].email);

  await db.insert(prescriptions).values(
    Object.entries(PRESCRIPTIONS).map(([bookingId, p]) => {
      const apt = byBooking.get(bookingId)!;
      return {
        appointmentId: apt.id,
        doctorId: apt.doctorId,
        patientId: patientOf(bookingId),
        diagnosis: p.diagnosis,
        medicines: p.medicines,
        advice: p.advice,
        followUpDate: shiftDate(p.followUpDays),
      };
    }),
  );
}

function shiftDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextDate(value: string): string | null {
  const offset = value.startsWith('Tomorrow') ? 1 : value.startsWith('Today') ? 0 : null;
  if (offset === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

if (import.meta.main) {
  runMigrations()
    .then(seed)
    .then(() => pool.end())
    .then(() => console.log('seed complete'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
