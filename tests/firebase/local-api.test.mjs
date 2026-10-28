import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { localServerlessApi } from '../../server/viteApi.ts'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

test('npm dev API authenticates and enrolls sellers through the real HTTP route',async()=>{
 const app=initializeApp({projectId:'demo-shopsphere'},'local-api-test'),auth=getAuth(app),db=getFirestore(app)
 // Never overwrite the browser dev server's optimized dependency cache.
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.cache/vite-api-tests',optimizeDeps:{noDiscovery:true,include:[]},plugins:[localServerlessApi()],server:{host:'127.0.0.1',port:0}})
 let uid
 try{
  await vite.listen()
  const address=vite.httpServer.address(),base=`http://127.0.0.1:${address.port}`
  const anonymous=await fetch(`${base}/api/enrollSeller`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})
  assert.equal(anonymous.status,401)
  const email=`local-api-${Date.now()}@example.test`,password='Tutorial123!'
  const user=await auth.createUser({email,password,emailVerified:true});uid=user.uid
  const login=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})}).then(response=>response.json())
  const enrolled=await fetch(`${base}/api/enrollSeller`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${login.idToken}`,origin:base},body:JSON.stringify({uid:'someone-else',role:'admin'})})
  assert.equal(enrolled.status,200)
  assert.equal((await enrolled.json()).data.ok,true)
  assert.equal((await db.doc(`sellerProfiles/${uid}`).get()).data().ownerId,uid)
  assert.equal((await auth.getUser(uid)).customClaims.role,'seller')
 }finally{await vite.close();if(uid){await db.doc(`sellerProfiles/${uid}`).delete();await auth.deleteUser(uid)}await deleteApp(app)}
})
