import type { QueryClient } from '@tanstack/react-query'

/** TanStack Query key factories — keep in sync with invalidation rules. */

export const queryKeys = {
  events: {
    userMonth: (userId: string, year: number, month: number) =>
      ['events', 'user', userId, year, month] as const,
    userYear: (userId: string, year: number) => ['events', 'user', userId, year] as const,
    userDay: (userId: string, year: number, month: number, day: string) =>
      ['events', 'user', userId, year, month, day] as const,
    publicMonth: (username: string, year: number, month: number) =>
      ['events', 'public', username, year, month] as const,
    allUser: (userId: string) => ['events', 'user', userId] as const,
    allPublic: (username: string) => ['events', 'public', username] as const,
  },
  profile: {
    me: (userId: string) => ['profile', userId] as const,
    public: (username: string) => ['profile', 'public', username] as const,
  },
  attachments: {
    event: (eventId: string) => ['attachments', 'event', eventId] as const,
  },
} as const

export function invalidateAllEventQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['events'] })
}

export function invalidateAttachmentQueries(
  queryClient: QueryClient,
  eventId: string,
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.attachments.event(eventId) })
}
