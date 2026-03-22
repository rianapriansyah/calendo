import { useQuery } from '@tanstack/react-query'
import { listEventAttachments } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'

export function useEventAttachmentsQuery(opts: {
  eventId: string | null
  accessToken: string | null
  enabled: boolean
}) {
  const { eventId, accessToken, enabled } = opts
  return useQuery({
    queryKey: eventId ? queryKeys.attachments.event(eventId) : ['attachments', 'none'],
    enabled: Boolean(enabled && eventId && accessToken),
    queryFn: async () => {
      const r = await listEventAttachments(accessToken!, eventId!)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
  })
}
