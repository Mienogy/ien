import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client (Workflow §35).
 *
 * The URL and anon key come from environment variables — never hard-coded.
 * The anon key is safe to ship to the browser: it is a *public* key.
 * All data access is protected by Row Level Security (see migrations),
 * NOT by keeping the key secret.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both env vars are present — lets the UI show a clear setup state. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function create(): SupabaseClient {
  if (!isSupabaseConfigured) {
    // Return a client that will fail loudly on use, so the app still boots
    // and can render a helpful "configure Supabase" message.
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: true },
    })
  }
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // handles OAuth + password-recovery redirects
    },
  })
}

export const supabase: SupabaseClient = create()
