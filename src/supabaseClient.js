import { createClient } from "@supabase/supabase-js";

// Debug logging
console.log('=== SUPABASE CONFIG DEBUG ===');
console.log('All env vars:', process.env);
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('============================');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('REACT_APP_SUPABASE_URL is missing!');
  throw new Error('Missing REACT_APP_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('REACT_APP_SUPABASE_ANON_KEY is missing!');
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   
    autoRefreshToken: true,
  },
});