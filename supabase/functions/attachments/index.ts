import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'
import { matchTail } from '../_shared/route.ts'

const BUCKET = 'event-attachments'
const MAX_BYTES = 25 * 1024 * 1024

function safeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '').replace(/\0/g, '')
  const cleaned = base.slice(0, 200)
  return cleaned || 'file'
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
  const { id: pathId } = matchTail(url.pathname, 'attachments')

  try {
    if (req.method === 'GET' && !pathId) {
      const eventId = url.searchParams.get('event_id')?.trim()
      if (!eventId) {
        return apiError(400, 'BAD_REQUEST', 'event_id query parameter is required')
      }

      const { data: ev, error: evErr } = await admin
        .from('events')
        .select('id, user_id')
        .eq('id', eventId)
        .maybeSingle()

      if (evErr) return apiError(500, 'DB_ERROR', evErr.message)
      if (!ev) return apiError(404, 'NOT_FOUND', 'Event not found')
      if (ev.user_id !== user.id) {
        return apiError(403, 'FORBIDDEN', 'You cannot view attachments for this event')
      }

      const { data: rows, error: listErr } = await admin
        .from('event_attachments')
        .select('*')
        .eq('event_id', eventId)
        .order('file_name', { ascending: true })

      if (listErr) return apiError(500, 'DB_ERROR', listErr.message)

      const enriched = await Promise.all(
        (rows ?? []).map(async (row) => {
          const path = row.file_url as string
          const { data: signed } = await admin.storage
            .from(BUCKET)
            .createSignedUrl(path, 3600)
          return { ...row, signed_url: signed?.signedUrl ?? null }
        }),
      )

      return ok(enriched)
    }

    if (req.method === 'POST' && !pathId) {
      const ct = req.headers.get('content-type') ?? ''
      if (!ct.includes('multipart/form-data')) {
        return apiError(400, 'BAD_REQUEST', 'Expected multipart/form-data')
      }

      const form = await req.formData()
      const eventId = String(form.get('event_id') ?? '').trim()
      const file = form.get('file')

      if (!eventId) return apiError(400, 'BAD_REQUEST', 'event_id is required')
      if (!(file instanceof File)) {
        return apiError(400, 'BAD_REQUEST', 'file is required')
      }
      if (file.size > MAX_BYTES) {
        return apiError(400, 'BAD_REQUEST', 'File too large')
      }

      const { data: ev, error: evErr } = await admin
        .from('events')
        .select('id, user_id')
        .eq('id', eventId)
        .maybeSingle()

      if (evErr) return apiError(500, 'DB_ERROR', evErr.message)
      if (!ev) return apiError(404, 'NOT_FOUND', 'Event not found')
      if (ev.user_id !== user.id) {
        return apiError(403, 'FORBIDDEN', 'You cannot attach files to this event')
      }

      const displayName = safeFileName(file.name)
      const objectPath = `${user.id}/${eventId}/${displayName}`

      const buf = new Uint8Array(await file.arrayBuffer())
      const { error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, buf, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

      if (upErr) {
        const msg = upErr.message.toLowerCase()
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          return apiError(400, 'CONFLICT', 'A file with this name already exists for this event')
        }
        return apiError(500, 'STORAGE_ERROR', upErr.message)
      }

      const { data: row, error: insErr } = await admin
        .from('event_attachments')
        .insert({
          event_id: eventId,
          file_url: objectPath,
          file_name: displayName,
        })
        .select('*')
        .single()

      if (insErr) {
        await admin.storage.from(BUCKET).remove([objectPath])
        return apiError(500, 'DB_ERROR', insErr.message)
      }

      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(objectPath, 3600)

      return ok({ ...row, signed_url: signed?.signedUrl ?? null }, 201)
    }

    if (req.method === 'DELETE' && pathId) {
      const { data: row, error: qErr } = await admin
        .from('event_attachments')
        .select('id, file_url, event_id, events!inner(user_id)')
        .eq('id', pathId)
        .maybeSingle()

      if (qErr) return apiError(500, 'DB_ERROR', qErr.message)
      if (!row) return apiError(404, 'NOT_FOUND', 'Attachment not found')

      const inner = row as unknown as {
        file_url: string
        events: { user_id: string }
      }
      if (inner.events.user_id !== user.id) {
        return apiError(403, 'FORBIDDEN', 'You cannot delete this attachment')
      }

      const { error: delErr } = await admin.from('event_attachments').delete().eq('id', pathId)
      if (delErr) return apiError(500, 'DB_ERROR', delErr.message)

      const { error: rmErr } = await admin.storage.from(BUCKET).remove([inner.file_url])
      if (rmErr) return apiError(500, 'STORAGE_ERROR', rmErr.message)

      return ok({ deleted: true })
    }

    if (pathId) {
      return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
    }

    return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    return apiError(500, 'INTERNAL', msg)
  }
})
