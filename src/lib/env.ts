const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? ''
const publishable =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''

if ((!url || !publishable) && import.meta.env.DEV) {
  console.warn(
    '[Calendo] Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to .env.local.',
  )
}

export const isSupabaseConfigured = Boolean(url && publishable)

/**
 * Supabase project URL (Auth + Edge Functions base).
 * No fallback — on Vercel you must set VITE_SUPABASE_URL or auth returns 401 Invalid API Key.
 */
export function getSupabaseUrl(): string {
  return url
}

/**
 * Supabase anon / publishable key — browser only.
 * No placeholder fallback — missing env on deploy causes Supabase to reject requests as invalid apikey.
 */
export function getSupabasePublishableKey(): string {
  return publishable
}

/** Base URL for invoking Edge Functions (Calendo API). */
export function getFunctionsBaseUrl(): string {
  return `${getSupabaseUrl()}/functions/v1`
}
