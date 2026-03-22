import { corsHeaders } from './cors.ts'

export type ApiSuccess<T> = { data: T; error: null }
export type ApiErrorBody = { data: null; error: { message: string; code: string } }

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

export function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data, error: null } satisfies ApiSuccess<T>), {
    status,
    headers: jsonHeaders,
  })
}

export function apiError(
  status: number,
  code: string,
  message: string,
): Response {
  return new Response(
    JSON.stringify({
      data: null,
      error: { code, message },
    } satisfies ApiErrorBody),
    { status, headers: jsonHeaders },
  )
}
