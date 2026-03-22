import { apiFetch, type ApiFetchOptions } from './fetch'

export type ApiJsonOptions = Omit<ApiFetchOptions, 'body'> & {
  method?: string
  body?: unknown
}

type Envelope<T> = {
  data: T | null
  error: { message: string; code: string } | null
}

export async function apiJson<T>(
  functionName: string,
  path: string,
  options: ApiJsonOptions = {},
): Promise<
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: string; message: string }
> {
  const { body, method, accessToken, headers, ...rest } = options
  const merged = new Headers(headers)
  if (body !== undefined) {
    merged.set('Content-Type', 'application/json')
  }

  const p = path.startsWith('/') ? path : `/${path}`
  const res = await apiFetch(functionName, p, {
    ...rest,
    method: method ?? 'GET',
    headers: merged,
    accessToken,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let payload: Envelope<T>
  try {
    payload = (await res.json()) as Envelope<T>
  } catch {
    return {
      ok: false,
      status: res.status,
      code: 'PARSE_ERROR',
      message: 'Invalid JSON response',
    }
  }

  if (payload.error) {
    return {
      ok: false,
      status: res.status,
      code: payload.error.code,
      message: payload.error.message,
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      code: 'HTTP_ERROR',
      message: res.statusText,
    }
  }

  return { ok: true, status: res.status, data: payload.data as T }
}
