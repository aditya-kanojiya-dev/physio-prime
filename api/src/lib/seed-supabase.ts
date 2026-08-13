import { DOCTORS_DATA } from './seed-data/doctors';
import { getSupabaseAdmin } from './supabase';

// Creates Supabase auth accounts for every seed doctor, the demo patients, and
// the admin, so they can log into the patient site (src/) and the portals.
// Password: physio123. Idempotent — skips emails that already exist in Supabase auth.
// ponytail: email/password for the demo; real onboarding would send invites or
// collect phone/OTP. Supabase auto-sends a confirm email, so confirmation may be
// required before sign-in depending on the project's auth settings.
const DEMO_ACCOUNTS = [
  ...DOCTORS_DATA.map((d) => ({ email: d.email, name: d.name })),
  { email: 'ravi@physio.example', name: 'Ravi Kumar' },
  { email: 'priya@physio.example', name: 'Priya Sharma' },
  { email: 'kavita@physio.example', name: 'Kavita Patel' },
  { email: 'amit@physio.example', name: 'Amit Verma' },
  { email: 'sneha@physio.example', name: 'Sneha Reddy' },
  { email: 'mohan@physio.example', name: 'Mohan Gupta' },
  { email: 'fatima@physio.example', name: 'Fatima Khan' },
  { email: 'admin@physio.example', name: 'Platform Admin' },
];

export async function seedSupabaseUsers(): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set((existing?.users ?? []).map((u) => u.email));

  for (const account of DEMO_ACCOUNTS) {
    if (existingEmails.has(account.email)) continue;
    const { error } = await admin.auth.admin.createUser({
      email: account.email,
      password: 'physio123',
      email_confirm: true,
      user_metadata: { name: account.name },
    });
    if (error) console.error(`skip ${account.email}: ${error.message}`);
    else console.log(`created ${account.email}`);
  }
}

if (process.argv[1]?.endsWith('seed-supabase.ts')) {
  seedSupabaseUsers()
    .then(() => {
      console.log('done');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
