import { readFile, readdir, writeFile } from 'node:fs/promises'

// Copies the existing server credential into an ignored local environment file.
// Never prints credentials or sends them to a hosting provider.
const filename = process.env.GOOGLE_APPLICATION_CREDENTIALS || (await readdir('.')).find(name => name.includes('firebase-adminsdk') && name.endsWith('.json'))
if (!filename) throw new Error('The existing service-account JSON was not found.')
const credential = JSON.parse(await readFile(filename, 'utf8'))
if (credential.project_id !== 'binarystore-18da7' || !credential.client_email || !credential.private_key) throw new Error('The service account does not match this project.')
let existing = await readFile('.env', 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error })
const variables = { FIREBASE_ADMIN_PROJECT_ID: credential.project_id, FIREBASE_ADMIN_CLIENT_EMAIL: credential.client_email, FIREBASE_ADMIN_PRIVATE_KEY: credential.private_key }
existing = existing.split(/\r?\n/).filter(line => !Object.keys(variables).some(key => line.startsWith(`${key}=`))).join('\n').trim()
const values = Object.entries(variables).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n')
await writeFile('.env', `${existing ? `${existing}\n` : ''}${values}\n`, { mode: 0o600 })
console.log('Prepared ignored .env for local Netlify Dev. No credentials were printed or uploaded.')
