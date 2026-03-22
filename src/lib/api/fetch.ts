import { getFunctionsBaseUrl, getSupabasePublishableKey } from '../env'

export type ApiFetchOptions = RequestInit & {
  accessToken?: string | null
}

export async function apiFetch(
  functionName: string,
  path: string,
  { accessToken, headers, ...init }: ApiFetchOptions = {},
): Promise<Response> {
  const url = `${getFunctionsBaseUrl()}/${functionName.replace(/^\//, '')}${path.startsWith('/') ? path : `/${path}`}`
  const mergedHeaders = new Headers(headers)
  mergedHeaders.set('apikey', getSupabasePublishableKey())
  if (accessToken) {
    mergedHeaders.set('Authorization', `Bearer ${accessToken}`)
  }
  return fetch(url, { ...init, headers: mergedHeaders })
}
