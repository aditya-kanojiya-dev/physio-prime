import { DOCTORS_DATA } from './seed-data/doctors';
import { getSupabaseAdmin } from './supabase';

// Creates Supabase auth accounts for every seed doctor plus the admin, so they
// can log into the doctor portal (admin/). Password: physio123. Idempotent —
// skips emails that already exist in Supabase auth.
// ponytail: email/password for the demo; real onboarding would send invites or
// collect phone/OTP. Supabase auto-sends a confirm email, so confirmation may be
// required before sign-in depending on the project's auth settings.
export async function seedSupabaseUsers(): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set((existing?.users ?? []).map((u) => u.email));

  for (const d of DOCTORS_DATA) {
    if (existingEmails.has(d.email)) continue;
    const { error } = await admin.auth.admin.createUser({
      email: d.email,
      password: 'physio123',
      email_confirm: true,
      user_metadata: { name: d.name },
    });
    if (error) console.error(`skip ${d.email}: ${error.message}`);
    else console.log(`created ${d.email}`);
  }

  if (!existingEmails.has('admin@physio.example')) {
    const { error } = await admin.auth.admin.createUser({
      email: 'admin@physio.example',
      password: 'physio123',
      email_confirm: true,
      user_metadata: { name: 'Platform Admin' },
    });
    if (error) console.error(`skip admin@physio.example: ${error.message}`);
    else console.log('created admin@physio.example');
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
