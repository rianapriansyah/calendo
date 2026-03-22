/**
 * Link + deploy all Edge Functions (uses Management API; no Docker).
 *
 * Auth: set SUPABASE_ACCESS_TOKEN in the environment, OR put the token alone in
 * `.supabase-token` in the project root (file is gitignored).
 *
 * Project ref: set SUPABASE_PROJECT_REF, or ensure VITE_SUPABASE_URL in `.env.local`
 * is `https://<ref>.supabase.co`.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadToken() {
  let token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  if (token) return token
  const p = join(root, '.supabase-token')
  if (existsSync(p)) {
    token = readFileSync(p, 'utf8').trim()
    if (token) return token
  }
  return null
}

function parseProjectRefFromEnvFile(name) {
  const p = join(root, name)
  if (!existsSync(p)) return null
  const text = readFileSync(p, 'utf8')
  const m = text.match(
    /^\s*VITE_SUPABASE_URL\s*=\s*["']?https:\/\/([a-z0-9]+)\.supabase\.co\/?["']?\s*$/im,
  )
  return m ? m[1] : null
}

function projectRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF?.trim()
  if (fromEnv) return fromEnv
  return parseProjectRefFromEnvFile('.env.local') ?? parseProjectRefFromEnvFile('.env')
}

const token = loadToken()
if (!token) {
  console.error(
    'Missing token. Either:\n' +
      '  • Set env SUPABASE_ACCESS_TOKEN, or\n' +
      '  • Create file `.supabase-token` in the project root with your personal access token (one line).\n',
  )
  process.exit(1)
}

const ref = projectRef()
if (!ref) {
  console.error(
    'Missing project ref. Set SUPABASE_PROJECT_REF or VITE_SUPABASE_URL=https://<ref>.supabase.co in .env.local',
  )
  process.exit(1)
}

process.env.SUPABASE_ACCESS_TOKEN = token

const run = (cmd) => {
  execSync(cmd, { stdio: 'inherit', cwd: root, env: process.env, shell: true })
}

console.log(`Linking project ${ref}…`)
run(`npx --yes supabase@latest link --project-ref ${ref} --yes`)

console.log('Deploying all Edge Functions…')
run(`npx --yes supabase@latest functions deploy --use-api --project-ref ${ref}`)

console.log('Done.')
