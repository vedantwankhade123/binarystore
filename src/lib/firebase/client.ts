import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
const env=import.meta.env
const config={apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,messagingSenderId:env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:env.VITE_FIREBASE_APP_ID}
export const firebaseConfigured=!!(config.apiKey&&config.authDomain&&config.projectId&&config.appId)
if(!firebaseConfigured)throw new Error('Firebase web configuration is missing. Copy .env.example to .env.local and supply your project values.')
export const app=getApps().length?getApp():initializeApp(config)
export const auth=getAuth(app)
export const db=getFirestore(app)
export const usingEmulators=env.VITE_FIREBASE_USE_EMULATORS==='true'
const runtime=globalThis as typeof globalThis & {__shopsphereEmulatorsConnected?:boolean}
if(usingEmulators&&!runtime.__shopsphereEmulatorsConnected){const host=env.VITE_FIREBASE_EMULATOR_HOST||'127.0.0.1';connectAuthEmulator(auth,`http://${host}:9099`,{disableWarnings:true});connectFirestoreEmulator(db,host,8080);runtime.__shopsphereEmulatorsConnected=true}
// Analytics is intentionally not initialized: authentication and database access do not require tracking.
