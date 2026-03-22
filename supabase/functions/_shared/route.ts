/** Match `/functions/v1/{name}` or `/functions/v1/{name}/{id}` tail. */
export function matchTail(pathname: string, name: string): { id: string | null } {
  const re = new RegExp(`\\/${name}(?:\\/([^/?]+))?\\/?$`)
  const m = pathname.match(re)
  if (!m) return { id: null }
  return { id: m[1] ?? null }
}
