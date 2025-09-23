import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pwucrztnpxmbpwduvsgd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dWNyenRucHhtYnB3ZHV2c2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTgxMzMsImV4cCI6MjA3MzE5NDEzM30.w-anpAFkRID_aIZtvXsX1O3qk7Pq9Un4QFZr-g_MrDw";

if (!supabaseUrl) {
  throw new Error("Missing REACT_APP_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

