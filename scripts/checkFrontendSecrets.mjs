import { loadEnv } from 'vite'
import { readFile,readdir } from 'node:fs/promises'
import { join } from 'node:path'
const keys=(await readdir('.')).filter(name=>name.includes('firebase-adminsdk')&&name.endsWith('.json'))
const fingerprints=[]
for(const file of keys){const value=JSON.parse(await readFile(file,'utf8'));if(value.private_key){fingerprints.push(value.private_key,JSON.stringify(value.private_key));const body=value.private_key.split('\n').find(line=>line.length>50&&!line.startsWith('---'));if(body)fingerprints.push(body)}}
const env={...loadEnv('development',process.cwd(),''),...process.env};if(env.CLOUDINARY_API_SECRET)fingerprints.push(env.CLOUDINARY_API_SECRET)
let checked=0
async function scan(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory()){await scan(path);continue}checked++;if(entry.name.includes('firebase-adminsdk'))throw new Error('Server credential file was copied into the build.');const value=await readFile(path,'utf8');if(fingerprints.some(secret=>value.includes(secret)))throw new Error('Server private-key material was found in the frontend build.')}}
await scan('dist');console.log(JSON.stringify({checkedFiles:checked,privateKeyInFrontend:false}))
