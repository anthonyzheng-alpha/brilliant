import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
const require = createRequire(join(globalRoot, 'firebase-tools/package.json'))

const firebaseAuth = require('firebase-tools/lib/auth')
const requireAuth = require('firebase-tools/lib/requireAuth')
const gcpAuth = require('firebase-tools/lib/gcp/auth')

function readProjectFromEnv() {
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    const match = env.match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || readProjectFromEnv()
if (!PROJECT) {
  console.error('Could not determine Firebase project id (set VITE_FIREBASE_PROJECT_ID in .env)')
  process.exit(1)
}
const LOCAL_DOMAINS = ['localhost', '127.0.0.1']

const account = firebaseAuth.getGlobalDefaultAccount()
if (!account?.user || !account?.tokens) {
  console.error('Not logged in to Firebase. Run: firebase login')
  process.exit(1)
}

await requireAuth.requireAuth({ project: PROJECT, ...account })

const current = await gcpAuth.getAuthDomains(PROJECT)
const merged = [...new Set([...current, ...LOCAL_DOMAINS])]

if (merged.length === current.length) {
  console.log('Authorized domains already include localhost:', current)
  process.exit(0)
}

const updated = await gcpAuth.updateAuthDomains(PROJECT, merged)
console.log('Updated authorized domains:', updated)
