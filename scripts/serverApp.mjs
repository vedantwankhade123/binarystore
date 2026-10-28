import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
export async function serverApp(){
 if(process.env.FIRESTORE_EMULATOR_HOST){const host=process.env.FIRESTORE_EMULATOR_HOST;if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))throw new Error('Emulator operations require a loopback host.');return initializeApp({projectId:process.env.GCLOUD_PROJECT||'demo-shopsphere'})}
 const file=process.env.GOOGLE_APPLICATION_CREDENTIALS|| (await readdir(process.cwd())).find(name=>name.includes('firebase-adminsdk')&&name.endsWith('.json'))
 if(!file)throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a server-only service-account file.')
 const credentials=JSON.parse(await readFile(resolve(file),'utf8'))
 if(credentials.project_id!=='binarystore-18da7')throw new Error('Credential project does not match the configured BinaryStore project.')
 return initializeApp({credential:cert(credentials),projectId:credentials.project_id})
}
