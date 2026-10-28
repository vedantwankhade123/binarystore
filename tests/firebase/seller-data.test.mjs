import test from 'node:test'
import assert from 'node:assert/strict'
import {initializeApp,deleteApp} from 'firebase/app'
import {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,reload} from 'firebase/auth'
import {getFirestore,connectFirestoreEmulator,doc,getDoc,updateDoc,serverTimestamp,collection,query,where,getDocs} from 'firebase/firestore'
import {initializeApp as initializeAdmin,deleteApp as deleteAdmin,getApps as getAdminApps} from 'firebase-admin/app'
import {getAuth as getAdminAuth} from 'firebase-admin/auth'
import handler from '../../netlify/functions/shop-api.ts'

test('seller profile and product changes persist under one UID and remain isolated from another seller',async()=>{
 const admin=initializeAdmin({projectId:'demo-shopsphere'},'seller-data'),adminAuth=getAdminAuth(admin),apps=[]
 async function seller(label){
  const app=initializeApp({apiKey:'demo-api-key',projectId:'demo-shopsphere'},`${label}-${Date.now()}`);apps.push(app)
  const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true})
  const {user}=await createUserWithEmailAndPassword(auth,`${label}-${Date.now()}@example.test`,'Tutorial123!');await adminAuth.updateUser(user.uid,{emailVerified:true});await reload(user)
  const token=await user.getIdToken(true),response=await handler(new Request('http://localhost/api/enrollSeller',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:'{}'}));assert.equal(response.status,200)
  await user.getIdToken(true)
  const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080)
  return {user,db}
 }
 try{
  const a=await seller('store-a'),b=await seller('store-b'),id=`listing-${a.user.uid}`
  await updateDoc(doc(a.db,'sellerProfiles',a.user.uid),{name:'My actual store',description:'Independent seller',address:'123 Main Street',updatedAt:serverTimestamp()})
  assert.equal((await getDoc(doc(a.db,'sellerProfiles',a.user.uid))).data().name,'My actual store')
  await assert.rejects(()=>getDoc(doc(b.db,'sellerProfiles',a.user.uid)),error=>error.code==='permission-denied')
  const product={ownerId:a.user.uid,source:'seller',externalId:null,title:'Seller-created product',description:'A persistent listing',category:'Accessories',price:25,discountPrice:null,sku:id,stock:12,images:[{id:'image',url:'https://example.test/item.jpg',name:'Product'}],status:'published',specifications:[],rating:0,reviews:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}
  async function save(account,data,productId){const token=await account.user.getIdToken();const response=await handler(new Request('http://localhost/api/saveProduct',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({product:data,...(productId?{id:productId}:{})})}));return {status:response.status,body:await response.json()}}
  const data={title:product.title,description:product.description,category:product.category,price:product.price,discountPrice:null,sku:product.sku,stock:12,images:product.images,status:'Active',specifications:[]}
  const created=await save(a,data);assert.equal(created.status,200);const productId=created.body.data.id
  assert.equal((await save(a,{...data,stock:11},productId)).status,200)
  assert.equal((await getDoc(doc(a.db,'products',productId))).data().stock,11)
  assert.equal((await save(b,{...data,stock:0},productId)).status,403)
  await assert.rejects(()=>updateDoc(doc(a.db,'products',productId),{stock:0,updatedAt:serverTimestamp()}),error=>error.code==='permission-denied')
  const owned=await getDocs(query(collection(b.db,'products'),where('ownerId','==',b.user.uid)));assert.equal(owned.docs.some(document=>document.id===productId),false)
  assert.equal((await save(a,{...data,status:'Draft'},productId)).status,200)
  await assert.rejects(()=>getDoc(doc(b.db,'products',productId)),error=>error.code==='permission-denied')
  assert.equal((await save(a,{...data,status:'Archived'},productId)).status,200)
  assert.equal((await getDoc(doc(a.db,'products',productId))).data().status,'archived')

 }finally{await Promise.all(apps.map(deleteApp));await Promise.all(getAdminApps().map(deleteAdmin))}
})
