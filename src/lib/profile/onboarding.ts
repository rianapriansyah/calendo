/** Default username from DB trigger: `u_` + UUID without dashes (32 hex). */
const AUTO_USERNAME = /^u_[a-f0-9]{32}$/i

export function needsOnboarding(profile: { username: string } | null | undefined): boolean {
  if (!profile) return true
  return AUTO_USERNAME.test(profile.username)
}
