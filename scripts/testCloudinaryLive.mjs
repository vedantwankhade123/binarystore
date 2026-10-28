import {loadEnv} from 'vite'
import {readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {initializeApp,getApps,deleteApp} from 'firebase-admin/app'
import {getAuth} from 'firebase-admin/auth'
import {getFirestore} from 'firebase-admin/firestore'
import handler from '../netlify/functions/shop-api.ts'
import {cloud,cleanupUploads} from '../server/media.ts'

// Firebase stays in local emulators. Only the small test images use the configured Cloudinary account.
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='demo-shopsphere'
Object.assign(process.env,loadEnv('development',process.cwd(),'CLOUDINARY_'))
const admin=initializeApp({projectId:'demo-shopsphere'},'cloudinary-live-test'),auth=getAuth(admin),db=getFirestore(admin),assets=[]
async function account(seller=true){const user=await auth.createUser({email:`media-${crypto.randomUUID()}@example.test`,password:'Tutorial123!',emailVerified:true});if(seller){await auth.setCustomUserClaims(user.uid,{role:'seller',sellerVerified:true});await db.doc(`sellerProfiles/${user.uid}`).set({ownerId:user.uid,approved:true})}const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:user.email,password:'Tutorial123!',returnSecureToken:true})});return {uid:user.uid,token:(await response.json()).idToken}}
async function call(account,operation,data){const response=await handler(new Request(`http://localhost/api/${operation}`,{method:'POST',headers:{authorization:`Bearer ${account.token}`,'content-type':'application/json'},body:JSON.stringify(data)}));return {status:response.status,...await response.json()}}
try{
 const seller=await account(),other=await account(),customer=await account(false),file=await readFile('public/images/hero.jpg')
 assert.equal((await call(customer,'signUpload',{name:'test.jpg',type:'image/jpeg',size:file.length})).status,403)
 assert.equal((await call(seller,'signUpload',{name:'bad.svg',type:'image/svg+xml',size:10})).status,400)
 assert.equal((await call(seller,'signUpload',{name:'big.jpg',type:'image/jpeg',size:9*1024*1024})).status,400)
 const uploaded=[]
 for(let index=0;index<3;index++){
  const signed=await call(seller,'signUpload',{name:`integration-${index}.jpg`,type:'image/jpeg',size:file.length});assert.equal(signed.status,200)
  assets.push(signed.data.publicId)
  const body=new FormData();body.append('file',new Blob([file],{type:'image/jpeg'}),'test.jpg');body.append('api_key',signed.data.apiKey);body.append('signature',signed.data.signature)
  for(const [key,value]of Object.entries(signed.data.parameters))body.append(key,String(value))
  const response=await fetch(`https://api.cloudinary.com/v1_1/${signed.data.cloudName}/image/upload`,{method:'POST',body});assert.equal(response.status,200,'Cloudinary upload failed; check the private configuration.')
  assert.equal((await call(other,'finalizeUpload',{id:signed.data.id})).status,403)
  const finalized=await call(seller,'finalizeUpload',{id:signed.data.id});assert.equal(finalized.status,200);uploaded.push(finalized.data)
 }
 const product={title:'Cloudinary integration test',description:'Test listing',category:'Accessories',price:25,discountPrice:null,sku:crypto.randomUUID(),stock:4,status:'Active',images:uploaded.slice(0,2),specifications:[]}
 const saved=await call(seller,'saveProduct',{product});assert.equal(saved.status,200);const id=saved.data.id
 assert.equal((await call(other,'deleteUpload',{id:uploaded[0].id,productId:id})).status,403)
 assert.equal((await call(other,'saveProduct',{id,product})).status,403)
 assert.equal((await call(seller,'saveProduct',{id,product:{...product,images:[uploaded[2],uploaded[0]]}})).status,200)
 assert.equal((await call(seller,'deleteUpload',{id:uploaded[0].id,productId:id})).status,200)
 assert.equal((await db.doc(`products/${id}`).get()).data().images[0].publicId,uploaded[2].publicId)
 assert.equal((await call(seller,'archiveProduct',{id})).status,200)
 await db.doc(`products/${id}`).delete()
 for(const image of uploaded)await db.doc(`imageUploads/${image.id}`).update({state:'deleting',expiresAt:new Date(0)})
 const cleaned=await cleanupUploads();assert(cleaned.cleaned>=3)
 console.log(JSON.stringify({actualCloudinaryUploads:3,productCreation:true,replacementAndPrimaryImage:true,ownerCheckedDeletion:true,archive:true,orphanCleanup:true,unauthorizedRequestsRejected:true}))
}finally{
 for(const id of assets)await cloud().uploader.destroy(id,{invalidate:true}).catch(()=>{})
 await Promise.all(getApps().map(deleteApp))
}
