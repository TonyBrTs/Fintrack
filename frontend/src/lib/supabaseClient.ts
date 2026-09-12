import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tjloylnetfaefuoyfwxy.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbG95bG5ldGZhZWZ1b3lmd3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjgyNDEsImV4cCI6MjEwNDgwNDI0MX0.m37ei41UitZJ5J7EMrokNQnFy4sezNkqEkGuj1Mu_Ho";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
