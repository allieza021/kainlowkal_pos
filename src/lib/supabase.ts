import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let browserClient: ReturnType<typeof createClient> | null = null;

export const hasSupabaseConfig = Boolean(url && anonKey);

export function getSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  if (!browserClient) {
    browserClient = createClient(url!, anonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return browserClient;
}

