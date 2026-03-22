import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEvent,
  deleteEvent,
  deleteAttachment,
  updateEvent,
  uploadAttachment,
} from '../lib/api'
import {
  invalidateAllEventQueries,
  invalidateAttachmentQueries,
} from '../lib/queryKeys'

export function useCreateEventMutation(accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await createEvent(accessToken, body)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => invalidateAllEventQueries(qc),
  })
}

export function useUpdateEventMutation(accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const r = await updateEvent(accessToken, id, body)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => invalidateAllEventQueries(qc),
  })
}

export function useDeleteEventMutation(accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteEvent(accessToken, id)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => invalidateAllEventQueries(qc),
  })
}

export function useUploadAttachmentMutation(accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, file }: { eventId: string; file: File }) => {
      const r = await uploadAttachment(accessToken, eventId, file)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: (_d, { eventId }) => {
      invalidateAllEventQueries(qc)
      invalidateAttachmentQueries(qc, eventId)
    },
  })
}

export function useDeleteAttachmentMutation(accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { attachmentId: string; eventId: string }) => {
      const r = await deleteAttachment(accessToken, input.attachmentId)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: (_d, { eventId }) => {
      invalidateAllEventQueries(qc)
      invalidateAttachmentQueries(qc, eventId)
    },
  })
}
