import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'

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

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (error) return apiError(500, 'DB_ERROR', error.message)
      if (!data) return apiError(404, 'NOT_FOUND', 'Profile not found')
      return ok(data)
    }

    const parsePatch = async (): Promise<Record<string, unknown> | Response> => {
      let body: Record<string, unknown>
      try {
        body = await req.json()
      } catch {
        return apiError(400, 'BAD_REQUEST', 'Invalid JSON body')
      }

      const patch: Record<string, unknown> = {}
      if (body.full_name !== undefined) {
        patch.full_name = String(body.full_name ?? '').trim()
      }
      if (body.username !== undefined) {
        const u = String(body.username ?? '').trim()
        if (!u) return apiError(400, 'BAD_REQUEST', 'username cannot be empty')
        patch.username = u

        const { data: taken, error: uErr } = await admin
          .from('profiles')
          .select('id')
          .ilike('username', u)
          .neq('id', user.id)
          .limit(1)

        if (uErr) return apiError(500, 'DB_ERROR', uErr.message)
        if (taken && taken.length > 0) {
          return apiError(400, 'USERNAME_TAKEN', 'Username already in use')
        }
      }
      if (body.avatar_url !== undefined) {
        patch.avatar_url = body.avatar_url === null ? null : String(body.avatar_url)
      }
      if (body.bio !== undefined) {
        patch.bio = body.bio === null ? null : String(body.bio)
      }
      if (body.timezone !== undefined) {
        const tz = String(body.timezone ?? '').trim()
        if (!tz) return apiError(400, 'BAD_REQUEST', 'timezone cannot be empty')
        patch.timezone = tz
      }
      if (body.is_public !== undefined) {
        patch.is_public = Boolean(body.is_public)
      }

      if (Object.keys(patch).length === 0) {
        return apiError(400, 'BAD_REQUEST', 'No fields to update')
      }

      return patch
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const patchOrErr = await parsePatch()
      if (patchOrErr instanceof Response) return patchOrErr
      const patch = patchOrErr

      const { data, error } = await admin
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) {
        if (error.code === '23505') {
          return apiError(400, 'USERNAME_TAKEN', 'Username already in use')
        }
        return apiError(500, 'DB_ERROR', error.message)
      }
      return ok(data, req.method === 'POST' ? 201 : 200)
    }

    return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    return apiError(500, 'INTERNAL', msg)
  }
})
