function fallbackZones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Jakarta',
    'Australia/Sydney',
  ]
}

export function getTimezoneOptions(): string[] {
  try {
    const list = Intl.supportedValuesOf('timeZone')
    return list.slice().sort((a, b) => a.localeCompare(b))
  } catch {
    return fallbackZones()
  }
}
