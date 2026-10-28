import { getFirestore } from 'firebase-admin/firestore'
import { serverApp } from './serverApp.mjs'
const app=await serverApp(),db=getFirestore(app)
const result={project:app.options.projectId,firestore:'unknown',emailPassword:'unknown',google:'unknown',authorizedDomains:[]}
try{await db.listCollections();result.firestore='reachable'}catch(error){result.firestore=String(error.code||'unavailable')}
try{const token=await app.options.credential.getAccessToken();const response=await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${app.options.projectId}/config`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(response.ok){const config=await response.json();result.authorizedDomains=config.authorizedDomains||[];result.emailPassword=config.signIn?.email?.enabled?'enabled':'disabled';const providers=await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${app.options.projectId}/defaultSupportedIdpConfigs/google.com`,{headers:{Authorization:`Bearer ${token.access_token}`}});result.google=providers.ok&&(await providers.json()).enabled?'enabled':'not enabled or not readable'}else result.emailPassword=`Console check required (HTTP ${response.status})`}catch{result.emailPassword='Console check required'}
console.log(JSON.stringify(result));process.exit(0)
