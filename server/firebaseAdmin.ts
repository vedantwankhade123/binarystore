import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// This module is imported only by Netlify Functions and local server tests.
export function getAdminServices() {
  const name = 'shopsphere-server'
  let app = getApps().find(candidate => candidate.name === name)
  if (!app) {
    const emulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
    if (emulator) {
      if (process.env.NETLIFY === 'true' && process.env.CONTEXT !== 'dev') {
        throw new Error('Emulators must not be enabled in deployed functions.')
      }
      const projectId = process.env.GCLOUD_PROJECT || 'demo-shopsphere'
      if (!projectId.startsWith('demo-') || ![process.env.FIRESTORE_EMULATOR_HOST, process.env.FIREBASE_AUTH_EMULATOR_HOST].every(host => !!host && /^(127\.0\.0\.1|localhost):\d+$/.test(host))) {
        throw new Error('Local testing requires both loopback emulators and a demo project.')
      }
      app = initializeApp({ projectId }, name)
    } else {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Configure the three FIREBASE_ADMIN_* server environment variables in Netlify.')
      }
      app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, name)
    }
  }
  return { auth: getAuth(app), db: getFirestore(app) }
}
