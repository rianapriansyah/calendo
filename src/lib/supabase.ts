import { createClient } from '@supabase/supabase-js'
import { getSupabasePublishableKey, getSupabaseUrl } from './env'

/**
 * Browser Supabase client — Auth only. All calendar data goes through Edge Functions.
 */
export const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
