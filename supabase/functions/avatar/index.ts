import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'

const BUCKET = 'avatars'
const MAX_BYTES = 5 * 1024 * 1024

function safeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '').replace(/\0/g, '')
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return cleaned || 'avatar'
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
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

  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('multipart/form-data')) {
    return apiError(400, 'BAD_REQUEST', 'Expected multipart/form-data')
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return apiError(400, 'BAD_REQUEST', 'file is required')
    }
    if (file.size > MAX_BYTES) {
      return apiError(400, 'BAD_REQUEST', 'File too large (max 5MB)')
    }

    const displayName = safeFileName(file.name)
    const objectPath = `${user.id}/${displayName}`

    const buf = new Uint8Array(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, buf, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })

    if (upErr) return apiError(500, 'STORAGE_ERROR', upErr.message)

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(objectPath)
    const avatarUrl = pub.publicUrl

    const { data: row, error: upProfileErr } = await admin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
      .select('avatar_url')
      .single()

    if (upProfileErr) return apiError(500, 'DB_ERROR', upProfileErr.message)

    return ok({ avatar_url: row?.avatar_url ?? avatarUrl }, 201)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    return apiError(500, 'INTERNAL', msg)
  }
})
