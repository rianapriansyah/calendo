import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { matchTail } from '../_shared/route.ts'

Deno.serve(async (req) => {
  const pre = corsPreflight(req)
  if (pre) return pre

  const url = new URL(req.url)
  if (matchTail(url.pathname, 'profile-public').id !== null) {
    return apiError(404, 'NOT_FOUND', 'Not found')
  }

  if (req.method !== 'GET') {
    return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  }

  let admin
  try {
    admin = createServiceClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Config error'
    return apiError(500, 'CONFIG', msg)
  }

  const username = url.searchParams.get('username')?.trim()
  if (!username) {
    return apiError(400, 'BAD_REQUEST', 'username query parameter is required')
  }

  const { data: rows, error } = await admin.rpc('get_profile_by_username', {
    p_username: username,
  })

  if (error) return apiError(500, 'DB_ERROR', error.message)
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return apiError(404, 'NOT_FOUND', 'Profile not found')

  const r = row as { is_public: boolean }

  if (!r.is_public) {
    return apiError(403, 'PRIVATE_PROFILE', 'This profile is private')
  }

  const {
    id,
    full_name,
    username: un,
    avatar_url,
    bio,
    timezone,
    is_public,
    created_at,
  } = row as Record<string, unknown>

  return ok({
    id,
    full_name,
    username: un,
    avatar_url,
    bio,
    timezone,
    is_public,
    created_at,
  })
})
