/** Escape `%`, `_`, `\` for use in PostgREST `ilike` without wildcard semantics. */
export function escapeILikeExact(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}
