import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { matchTail } from '../_shared/route.ts'
import { monthRange } from '../_shared/dates.ts'

Deno.serve(async (req) => {
  const pre = corsPreflight(req)
  if (pre) return pre

  const url = new URL(req.url)
  if (matchTail(url.pathname, 'events-public').id !== null) {
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

  const year = Number(url.searchParams.get('year'))
  const month = Number(url.searchParams.get('month'))
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return apiError(400, 'BAD_REQUEST', 'year and month query parameters are required')
  }

  const range = monthRange(year, month)
  if ('error' in range) return apiError(400, 'BAD_REQUEST', range.error)

  const { data: profRows, error: pErr } = await admin.rpc('match_public_profile', {
    p_username: username,
  })

  if (pErr) return apiError(500, 'DB_ERROR', pErr.message)
  const profile = Array.isArray(profRows) ? profRows[0] : null
  if (!profile) {
    return apiError(404, 'NOT_FOUND', 'Public profile not found')
  }

  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .lt('start_time', range.end)
    .gt('end_time', range.start)
    .order('start_time', { ascending: true })

  if (error) return apiError(500, 'DB_ERROR', error.message)
  return ok(data ?? [])
})
