const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? ''
const publishable =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''

if ((!url || !publishable) && import.meta.env.DEV) {
  console.warn(
    '[Calendo] Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.',
  )
}

export const isSupabaseConfigured = Boolean(url && publishable)

/** Supabase project URL (Auth + Edge Functions base). */
export function getSupabaseUrl(): string {
  return url || 'https://etfwkxbowhwlnuzxybbt.supabase.co'
}

/** Supabase publishable key — browser only; used for Auth session, not direct table access. */
export function getSupabasePublishableKey(): string {
  return publishable || 'placeholder-publishable-key'
}

/** Base URL for invoking Edge Functions (Calendo API). */
export function getFunctionsBaseUrl(): string {
  return `${getSupabaseUrl()}/functions/v1`
}
