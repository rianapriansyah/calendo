import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'
import { matchTail } from '../_shared/route.ts'
import { escapeILikeExact } from '../_shared/ilike.ts'

Deno.serve(async (req) => {
  const pre = corsPreflight(req)
  if (pre) return pre

  const url = new URL(req.url)
  if (matchTail(url.pathname, 'username-available').id !== null) {
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

  const auth = await requireUser(req)
  if (auth.error) return auth.error
  const { user } = auth

  const username = url.searchParams.get('username')?.trim()
  if (!username) {
    return apiError(400, 'BAD_REQUEST', 'username query parameter is required')
  }

  const { data: row, error } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', escapeILikeExact(username))
    .neq('id', user.id)
    .maybeSingle()

  if (error) return apiError(500, 'DB_ERROR', error.message)
  return ok({ available: row == null })
})
