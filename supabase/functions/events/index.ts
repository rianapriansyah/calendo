import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'
import { matchTail } from '../_shared/route.ts'
import { rangeFromQuery } from '../_shared/dates.ts'

const COLORS = new Set(['amber', 'sage', 'sky', 'rose', 'violet', 'orange'])

type EventRow = {
  title: string
  description?: string | null
  start_time: string
  end_time: string
  is_all_day?: boolean
  color?: string
  location?: string | null
  is_public?: boolean
}

function parseEventInput(body: Record<string, unknown>, partial: boolean): EventRow | Response {
  const title =
    body.title !== undefined && body.title !== null
      ? String(body.title).trim()
      : partial
        ? undefined
        : ''
  if (!partial && (!title || title.length === 0)) {
    return apiError(400, 'BAD_REQUEST', 'title is required')
  }

  const start_time =
    body.start_time !== undefined ? String(body.start_time) : partial ? undefined : ''
  const end_time = body.end_time !== undefined ? String(body.end_time) : partial ? undefined : ''
  if (!partial) {
    if (!start_time || !end_time) {
      return apiError(400, 'BAD_REQUEST', 'start_time and end_time are required')
    }
    const s = new Date(start_time)
    const e = new Date(end_time)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return apiError(400, 'BAD_REQUEST', 'Invalid start_time or end_time')
    }
    if (e < s) {
      return apiError(400, 'BAD_REQUEST', 'end_time must be >= start_time')
    }
  } else {
    if (start_time !== undefined && end_time !== undefined) {
      const s = new Date(start_time)
      const e = new Date(end_time)
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
        return apiError(400, 'BAD_REQUEST', 'Invalid start_time or end_time')
      }
      if (e < s) {
        return apiError(400, 'BAD_REQUEST', 'end_time must be >= start_time')
      }
    }
  }

  const colorRaw = body.color !== undefined ? String(body.color) : partial ? undefined : 'sky'
  if (colorRaw !== undefined && !COLORS.has(colorRaw)) {
    return apiError(400, 'BAD_REQUEST', 'Invalid color')
  }

  return {
    ...(title !== undefined ? { title } : {}),
    ...(body.description !== undefined
      ? { description: body.description === null ? null : String(body.description) }
      : {}),
    ...(start_time !== undefined ? { start_time } : {}),
    ...(end_time !== undefined ? { end_time } : {}),
    ...(body.is_all_day !== undefined ? { is_all_day: Boolean(body.is_all_day) } : {}),
    ...(colorRaw !== undefined ? { color: colorRaw } : {}),
    ...(body.location !== undefined
      ? { location: body.location === null ? null : String(body.location) }
      : {}),
    ...(body.is_public !== undefined ? { is_public: Boolean(body.is_public) } : {}),
  } as EventRow
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req)
  if (pre) return pre

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

  const url = new URL(req.url)
  const { id: pathId } = matchTail(url.pathname, 'events')

  try {
    if (req.method === 'GET' && !pathId) {
      const range = rangeFromQuery(url.searchParams)
      if ('error' in range) return apiError(400, 'BAD_REQUEST', range.error)

      const { data, error } = await admin
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .lt('start_time', range.end)
        .gt('end_time', range.start)
        .order('start_time', { ascending: true })

      if (error) return apiError(500, 'DB_ERROR', error.message)
      return ok(data ?? [])
    }

    if (req.method === 'POST' && !pathId) {
      let raw: Record<string, unknown>
      try {
        raw = await req.json()
      } catch {
        return apiError(400, 'BAD_REQUEST', 'Invalid JSON body')
      }
      const parsed = parseEventInput(raw, false)
      if (parsed instanceof Response) return parsed

      const { data, error } = await admin
        .from('events')
        .insert({
          user_id: user.id,
          title: parsed.title,
          description: parsed.description ?? null,
          start_time: parsed.start_time,
          end_time: parsed.end_time,
          is_all_day: parsed.is_all_day ?? false,
          color: parsed.color ?? 'sky',
          location: parsed.location ?? null,
          is_public: parsed.is_public ?? false,
        })
        .select('*')
        .single()

      if (error) return apiError(500, 'DB_ERROR', error.message)
      return ok(data, 201)
    }

    if (!pathId) {
      return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed for this path')
    }

    const { data: existing, error: loadErr } = await admin
      .from('events')
      .select('id, user_id')
      .eq('id', pathId)
      .maybeSingle()

    if (loadErr) return apiError(500, 'DB_ERROR', loadErr.message)
    if (!existing) return apiError(404, 'NOT_FOUND', 'Event not found')
    if (existing.user_id !== user.id) {
      return apiError(403, 'FORBIDDEN', 'You cannot modify this event')
    }

    if (req.method === 'PUT') {
      let raw: Record<string, unknown>
      try {
        raw = await req.json()
      } catch {
        return apiError(400, 'BAD_REQUEST', 'Invalid JSON body')
      }
      const parsed = parseEventInput(raw, true)
      if (parsed instanceof Response) return parsed

      const updatePayload: Record<string, unknown> = {}
      for (const k of Object.keys(parsed)) {
        const v = (parsed as Record<string, unknown>)[k]
        if (v !== undefined) updatePayload[k] = v
      }
      if (Object.keys(updatePayload).length === 0) {
        return apiError(400, 'BAD_REQUEST', 'No fields to update')
      }

      const { data, error } = await admin
        .from('events')
        .update(updatePayload)
        .eq('id', pathId)
        .select('*')
        .single()

      if (error) return apiError(500, 'DB_ERROR', error.message)
      return ok(data)
    }

    if (req.method === 'DELETE') {
      const { error } = await admin.from('events').delete().eq('id', pathId)
      if (error) return apiError(500, 'DB_ERROR', error.message)
      return ok({ deleted: true })
    }

    return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    return apiError(500, 'INTERNAL', msg)
  }
})
