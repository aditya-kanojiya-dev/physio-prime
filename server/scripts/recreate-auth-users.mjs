// ponytail: one-off migration helper — recreates Supabase Auth users for existing public.users rows
// with a shared test password. Delete after use.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'Test@1234';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  process.exit(1);
}

const emails = [
  'tarannum@physio.example', 'pritam@physio.example', 'jayshree@physio.example',
  'pratyush@physio.example', 'shubham@physio.example', 'ananya@physio.example',
  'admin@physio.example', 'ravi@physio.example', 'priya@physio.example',
  'kavita@physio.example', 'amit@physio.example', 'sneha@physio.example',
  'mohan@physio.example', 'fatima@physio.example', 'aditya.kanojiya.dev@gmail.com',
];

for (const email of emails) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(res.ok ? `OK    ${email}` : `FAIL  ${email} -> ${res.status} ${body.msg ?? body.message ?? ''}`);
}
