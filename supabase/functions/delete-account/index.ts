import { corsPreflight } from '../_shared/cors.ts'
import { ok, apiError } from '../_shared/json.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { requireUser } from '../_shared/auth.ts'

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

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return apiError(500, 'AUTH_ERROR', error.message)

  return ok({ deleted: true })
})
