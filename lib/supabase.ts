import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Database reads contain live stock. Image URLs keep their normal cache policy.
  global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
});
