/** Inclusive-exclusive range in UTC for overlap queries. */
export function rangeFromQuery(
  params: URLSearchParams,
): { start: string; end: string } | { error: string } {
  const view = (params.get('view') ?? 'month').toLowerCase()
  const now = new Date()

  if (view === 'day') {
    const dateStr = params.get('date')
    if (!dateStr) return { error: 'date is required when view=day (YYYY-MM-DD)' }
    const d = new Date(`${dateStr}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) return { error: 'Invalid date' }
    const end = new Date(d)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start: d.toISOString(), end: end.toISOString() }
  }

  if (view === 'year') {
    const year = Number(params.get('year') ?? now.getUTCFullYear())
    if (!Number.isFinite(year)) return { error: 'Invalid year' }
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
    return { start: start.toISOString(), end: end.toISOString() }
  }

  // month (default)
  const year = Number(params.get('year') ?? now.getUTCFullYear())
  const month = Number(params.get('month') ?? now.getUTCMonth() + 1)
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return { error: 'Invalid year or month (month: 1–12)' }
  }
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Public calendar: month grid from year + month. */
export function monthRange(
  year: number,
  month: number,
): { start: string; end: string } | { error: string } {
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return { error: 'Invalid year or month' }
  }
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}
