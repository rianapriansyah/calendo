import type { CalendarEvent, EventAttachment, Profile } from '../../types'
import { apiFetch } from './fetch'
import { apiJson } from './json'

function q(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function getProfile(accessToken: string) {
  return apiJson<Profile>('profile', '/', { accessToken })
}

/** Onboarding / profile upsert (Edge: POST). */
export async function createProfile(
  accessToken: string,
  body: Partial<
    Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'bio' | 'timezone' | 'is_public'>
  >,
) {
  return apiJson<Profile>('profile', '/', {
    method: 'POST',
    accessToken,
    body,
  })
}

export async function updateProfile(
  accessToken: string,
  patch: Partial<
    Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'bio' | 'timezone' | 'is_public'>
  >,
) {
  return apiJson<Profile>('profile', '/', {
    method: 'PUT',
    accessToken,
    body: patch,
  })
}

export async function getPublicProfile(username: string) {
  return apiJson<Profile>('profile-public', `/?username=${encodeURIComponent(username)}`)
}

export async function checkUsernameAvailable(accessToken: string, username: string) {
  return apiJson<{ available: boolean }>(
    'username-available',
    `/?username=${encodeURIComponent(username)}`,
    { accessToken },
  )
}

export async function listMyEvents(
  accessToken: string,
  params: {
    year?: number
    month?: number
    view: 'year' | 'month' | 'day'
    date?: string
  },
) {
  return apiJson<CalendarEvent[]>('events', `/${q(params)}`, { accessToken })
}

export async function listPublicEvents(username: string, year: number, month: number) {
  return apiJson<CalendarEvent[]>(
    'events-public',
    `/?${new URLSearchParams({ username, year: String(year), month: String(month) }).toString()}`,
  )
}

export async function createEvent(accessToken: string, body: Record<string, unknown>) {
  return apiJson<CalendarEvent>('events', '/', {
    method: 'POST',
    accessToken,
    body,
  })
}

export async function updateEvent(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiJson<CalendarEvent>('events', `/${id}`, {
    method: 'PUT',
    accessToken,
    body,
  })
}

export async function deleteEvent(accessToken: string, id: string) {
  return apiJson<{ deleted: boolean }>('events', `/${id}`, {
    method: 'DELETE',
    accessToken,
  })
}

export async function listEventAttachments(accessToken: string, eventId: string) {
  return apiJson<EventAttachment[]>(
    'attachments',
    `/?${new URLSearchParams({ event_id: eventId }).toString()}`,
    { accessToken },
  )
}

export async function uploadAttachment(accessToken: string, eventId: string, file: File) {
  const form = new FormData()
  form.set('event_id', eventId)
  form.set('file', file)
  const res = await apiFetch('attachments', '/', {
    method: 'POST',
    accessToken,
    body: form,
  })
  const payload = (await res.json()) as {
    data: EventAttachment | null
    error: { message: string; code: string } | null
  }
  if (payload.error || !res.ok) {
    return {
      ok: false as const,
      status: res.status,
      code: payload.error?.code ?? 'UNKNOWN',
      message: payload.error?.message ?? res.statusText,
    }
  }
  return { ok: true as const, status: res.status, data: payload.data as EventAttachment }
}

export async function deleteAttachment(accessToken: string, attachmentId: string) {
  return apiJson<{ deleted: boolean }>('attachments', `/${attachmentId}`, {
    method: 'DELETE',
    accessToken,
  })
}

export async function uploadAvatar(accessToken: string, file: File) {
  const form = new FormData()
  form.set('file', file)
  const res = await apiFetch('avatar', '/', {
    method: 'POST',
    accessToken,
    body: form,
  })
  const payload = (await res.json()) as {
    data: { avatar_url: string } | null
    error: { message: string; code: string } | null
  }
  if (payload.error || !res.ok) {
    return {
      ok: false as const,
      status: res.status,
      code: payload.error?.code ?? 'UNKNOWN',
      message: payload.error?.message ?? res.statusText,
    }
  }
  return { ok: true as const, status: res.status, data: payload.data as { avatar_url: string } }
}

export async function deleteAccount(accessToken: string) {
  return apiJson<{ deleted: boolean }>('delete-account', '/', {
    method: 'POST',
    accessToken,
  })
}
