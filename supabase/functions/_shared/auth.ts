import type { User } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { apiError } from './json.ts'

export type AuthResult =
  | { user: User; error: null }
  | { user: null; error: Response }

/**
 * Validates the caller's JWT using the anon key + forwarded Authorization header.
 * Avoids `service_role.auth.getUser(jwt)`, which can fail with newer Supabase JWT signing keys.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return { user: null, error: apiError(401, 'UNAUTHORIZED', 'Missing bearer token') }
  }
  const token = header.slice(7).trim()
  if (!token) {
    return { user: null, error: apiError(401, 'UNAUTHORIZED', 'Missing bearer token') }
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) {
    return {
      user: null,
      error: apiError(500, 'CONFIG', 'Missing SUPABASE_URL or SUPABASE_ANON_KEY'),
    }
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: header } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      error: apiError(401, 'UNAUTHORIZED', error?.message ?? 'Invalid or expired token'),
    }
  }
  return { user, error: null }
}
