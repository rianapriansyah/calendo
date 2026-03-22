import { useQuery } from '@tanstack/react-query'
import { checkUsernameAvailable, getProfile, getPublicProfile } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'

export function useProfileQuery(opts: { userId: string; accessToken: string; enabled?: boolean }) {
  const { userId, accessToken, enabled = true } = opts
  return useQuery({
    queryKey: queryKeys.profile.me(userId),
    enabled: enabled && Boolean(userId && accessToken),
    queryFn: async () => {
      const r = await getProfile(accessToken)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
  })
}

export function usePublicProfileQuery(opts: { username: string; enabled?: boolean }) {
  const { username, enabled = true } = opts
  const u = username.trim()
  return useQuery({
    queryKey: queryKeys.profile.public(u),
    enabled: enabled && Boolean(u),
    queryFn: async () => {
      const r = await getPublicProfile(u)
      if (!r.ok) {
        const err = new Error(r.message) as Error & { code: string; status: number }
        err.code = r.code
        err.status = r.status
        throw err
      }
      return r.data
    },
    retry: false,
  })
}

export function useUsernameAvailableQuery(opts: {
  accessToken: string
  username: string
  enabled?: boolean
}) {
  const { accessToken, username, enabled = true } = opts
  const t = username.trim()
  return useQuery({
    queryKey: ['username-available', accessToken, t],
    enabled: enabled && t.length >= 2 && Boolean(accessToken),
    queryFn: async () => {
      const r = await checkUsernameAvailable(accessToken, t)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
    staleTime: 20_000,
  })
}
