import { Readable } from 'node:stream'
import { loadEnv, type Plugin } from 'vite'

/** Local-only bridge to the same handlers deployed as Netlify Functions. */
export function localServerlessApi():Plugin {
 return {
  name:'binarystore-local-api',
  apply:'serve',
  configResolved(config){
   // These names are server-only. Vite exposes only VITE_* values to the browser.
   const values={...loadEnv(config.mode,config.envDir,'FIREBASE_ADMIN_'),...loadEnv(config.mode,config.envDir,'CLOUDINARY_')}
   for(const [name,value] of Object.entries(values))if(!process.env[name]&&value)process.env[name]=value
  },
  configureServer(server){
   // Local development has no Netlify scheduler. Retry expired draft cleanup privately.
   const timer=setInterval(()=>{
    if(process.env.CLOUDINARY_API_SECRET&&!process.env.FIRESTORE_EMULATOR_HOST)void import('./media.ts').then(module=>module.cleanupUploads()).catch(()=>console.error('Image cleanup will retry later.'))
   },15*60*1000)
   timer.unref();server.httpServer?.once('close',()=>clearInterval(timer))
   server.middlewares.use(async(incoming,outgoing,next)=>{
    if(!incoming.url?.startsWith('/api/'))return next()
    try{
     const {handleRequest}=await import('./http.ts')
     const headers=new Headers()
     for(const [name,value] of Object.entries(incoming.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(', '):value)
     const method=incoming.method||'GET'
     const init={method,headers,...(method==='GET'||method==='HEAD'?{}:{body:Readable.toWeb(incoming),duplex:'half'})}
     const request=new Request(`http://${incoming.headers.host||'localhost'}${incoming.url}`,init as ConstructorParameters<typeof Request>[1])
     const result=await handleRequest(request)
     const responseHeaders:Record<string,string>={}
     result.headers.forEach((value,name)=>{responseHeaders[name]=value})
     outgoing.writeHead(result.status,responseHeaders)
     outgoing.end(Buffer.from(await result.arrayBuffer()))
    }catch{
     outgoing.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'})
     outgoing.end(JSON.stringify({error:{code:'unavailable',message:'The local API could not start. Check the server-only Firebase credentials and restart development.'}}))
    }
   })
  },
 }
}
