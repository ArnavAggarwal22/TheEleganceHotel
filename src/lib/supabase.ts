import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined;

/**
 * The browser's Supabase client, or null when the site has no Supabase settings yet (.env.example).
 * Only the publishable key is used here; the database rules decide what each visitor can do.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // "Continue with Google" returns with a one-time code in the URL (PKCE flow)
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null;

export const hasBackend = !!supabase;
