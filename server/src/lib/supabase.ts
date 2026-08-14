import { createClient } from '@supabase/supabase-js';
import { getCoreConfig } from '../config';

export function getSupabaseAdmin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getCoreConfig();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
