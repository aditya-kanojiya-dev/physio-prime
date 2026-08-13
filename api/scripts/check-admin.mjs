import { createClient } from '@supabase/supabase-js';
import { getCoreConfig } from '../src/config';

async function main() {
  const cfg = getCoreConfig();
  const admin = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await admin.auth.admin.listUsers();
  const u = (data?.users || []).find((x) => x.email === 'admin@physio.example');
  console.log('auth user:', u ? 'confirmed=' + !!u.email_confirmed_at : 'NOT FOUND');

  const anon = createClient(cfg.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: s, error: loginErr } = await anon.auth.signInWithPassword({
    email: 'admin@physio.example',
    password: 'physio123',
  });
  if (loginErr) {
    console.log('login error:', loginErr.message);
    return;
  }
  const res = await fetch('http://localhost:4000/api/v1/admin/insights', {
    headers: { Authorization: 'Bearer ' + s.session.access_token },
  });
  console.log('insights status:', res.status);
  console.log('body:', JSON.stringify(await res.json()).slice(0, 600));
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
