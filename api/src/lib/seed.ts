import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/pool';
import { runMigrations } from '../db/migrate';
import { users, doctors, doctorApplications, doctorSchedules, categories, symptoms } from '../db/schema';
import { CATEGORIES_DATA } from './seed-data/categories';
import { SYMPTOMS_DATA } from './seed-data/symptoms';
import { DOCTORS_DATA } from './seed-data/doctors';

// ponytail: truncates users too so dev seed stays idempotent; drop `users` from
// this list once real registrations land in later phases.
export async function seed(): Promise<void> {
  await db.execute(
    sql`TRUNCATE users, doctors, doctor_applications, categories, symptoms RESTART IDENTITY CASCADE`,
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
        startTime: '09:00',
        endTime: '17:00',
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

  await db.insert(categories).values(CATEGORIES_DATA);
  await db.insert(symptoms).values(SYMPTOMS_DATA);
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
