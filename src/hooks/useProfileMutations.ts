import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createProfile,
  deleteAccount,
  updateProfile,
  uploadAvatar,
} from '../lib/api'
import { queryKeys } from '../lib/queryKeys'

export function useCreateProfileMutation(userId: string, accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      body: Parameters<typeof createProfile>[1],
    ) => {
      const r = await createProfile(accessToken, body)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me(userId) })
    },
  })
}

export function useUpdateProfileMutation(userId: string, accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Parameters<typeof updateProfile>[1]) => {
      const r = await updateProfile(accessToken, patch)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me(userId) })
    },
  })
}

export function useUploadAvatarMutation(userId: string, accessToken: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const r = await uploadAvatar(accessToken, file)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me(userId) })
    },
  })
}

export function useDeleteAccountMutation(accessToken: string) {
  return useMutation({
    mutationFn: async () => {
      const r = await deleteAccount(accessToken)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
  })
}
