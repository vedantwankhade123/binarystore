import test,{before,after,beforeEach} from 'node:test'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment,assertSucceeds,assertFails } from '@firebase/rules-unit-testing'
import { doc,setDoc,getDoc,updateDoc,deleteDoc,collection,getDocs,query,where,serverTimestamp,Timestamp } from 'firebase/firestore'
let env
const timestamp=Timestamp.fromMillis(1700000000000)
const claims={email:'seller@example.test',email_verified:true,role:'seller',sellerVerified:true}
const product={ownerId:'seller-a',source:'seller',externalId:null,title:'A real listing',description:'Test listing',category:'Accessories',price:50,discountPrice:null,sku:'SKU-A',stock:10,images:[{id:'image',url:'https://example.test/image.jpg',name:'Image'}],status:'published',specifications:[],rating:0,reviews:0,createdAt:timestamp,updatedAt:timestamp}
const sellerProfile=uid=>({ownerId:uid,approved:true,requestedAt:timestamp,updatedAt:timestamp,name:'Store',description:'A store',email:'seller@example.test',phone:'',address:'',logo:[],notifications:{orders:true,lowStock:true,weeklyReport:false}})
const snapshot={id:'fakestore:1',source:{kind:'fakestore',externalId:'1'},name:'Backpack',description:'A backpack',category:'Accessories',price:50,rating:4,reviews:10,image:'https://example.test/bag.jpg'}
const db=(uid,custom={})=>uid?env.authenticatedContext(uid,{email:`${uid}@example.test`,email_verified:true,...custom}).firestore():env.unauthenticatedContext().firestore()
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-shopsphere',firestore:{rules:await readFile('firestore.rules','utf8')}})})
after(async()=>{await env.cleanup()})
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{const store=context.firestore();await Promise.all([setDoc(doc(store,'sellerProfiles','seller-a'),sellerProfile('seller-a')),setDoc(doc(store,'sellerProfiles','seller-b'),sellerProfile('seller-b')),setDoc(doc(store,'products','published'),product),setDoc(doc(store,'products','draft'),{...product,status:'draft'}),setDoc(doc(store,'orders','order-a'),{customerId:'alice',status:'Delivered',total:50}),setDoc(doc(store,'orderItems','order-a_firestore:published'),{customerId:'alice',sellerId:'seller-a',orderId:'order-a',productId:'firestore:published'}),setDoc(doc(store,'sellerFulfillments','fulfillment-a'),{sellerId:'seller-a',orderId:'order-a'})])})})
test('private profiles: only owner reads permitted fields; self-assigned roles denied',async()=>{
 const own=db('alice'),ref=doc(own,'users','alice'),data={uid:'alice',displayName:'Alice',email:'alice@example.test',avatar:'',phone:'',profileComplete:false,preferences:{newsletter:false,orderUpdates:true},addresses:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()}
 await assertSucceeds(setDoc(ref,data));await assertSucceeds(getDoc(ref));await assertFails(getDoc(doc(db('bob'),'users','alice')));await assertFails(getDoc(doc(db(),'users','alice')))
 await assertFails(updateDoc(ref,{role:'seller',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{email:'someone@example.test',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{displayName:'Updated',updatedAt:serverTimestamp()}))
})
test('public catalog reads only published documents and constrained queries',async()=>{
 await assertSucceeds(getDoc(doc(db(),'products','published')));await assertFails(getDoc(doc(db(),'products','draft')))
 await assertSucceeds(getDocs(query(collection(db(),'products'),where('status','==','published'))));await assertFails(getDocs(collection(db(),'products')))
 await assertSucceeds(getDoc(doc(db('seller-a',claims),'products','draft')));await assertFails(getDoc(doc(db('seller-b',claims),'products','draft')))
})
test('all direct product and inventory writes are denied, including the owning seller',async()=>{
 const store=db('seller-a',claims)
 await assertFails(setDoc(doc(store,'products','new'),{...product,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(store,'products','published'),{stock:9,updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(store,'products','published'),{status:'archived',updatedAt:serverTimestamp()}))
 await assertFails(deleteDoc(doc(store,'products','published')))
 await assertFails(getDoc(doc(store,'imageUploads','someone-else')))
 await assertFails(setDoc(doc(store,'imageUploads','fake'),{ownerId:'seller-a',state:'ready'}))
})

test('cart and wishlist documents are private with bounded quantities and matching IDs',async()=>{
 const own=db('alice'),cart=doc(own,'carts','alice','items','fakestore:1'),item={product:snapshot,quantity:2,updatedAt:serverTimestamp()}
 await assertSucceeds(setDoc(cart,item));await assertFails(getDoc(doc(db('bob'),'carts','alice','items','fakestore:1')));await assertFails(getDocs(collection(db('bob'),'carts','alice','items')));await assertFails(setDoc(cart,{...item,quantity:0}));await assertFails(setDoc(cart,{...item,quantity:100}));await assertFails(setDoc(doc(own,'carts','alice','items','wrong-id'),item));await assertFails(setDoc(doc(own,'carts','alice'),{ownerId:'bob',updatedAt:serverTimestamp()}))
 await assertSucceeds(setDoc(doc(own,'wishlists','alice','items','fakestore:1'),{product:snapshot,updatedAt:serverTimestamp()}));await assertFails(getDoc(doc(db('bob'),'wishlists','alice','items','fakestore:1')))
 await assertSucceeds(setDoc(doc(own,'carts','alice','merges','guest-1'),{createdAt:serverTimestamp()}));await assertFails(updateDoc(doc(own,'carts','alice','merges','guest-1'),{createdAt:serverTimestamp()}))
})
test('seller enrollment is server-only; enabled flags and suspension cannot be self-assigned',async()=>{
 const pending={...sellerProfile('alice'),approved:false,requestedAt:serverTimestamp(),updatedAt:serverTimestamp()}
 await assertFails(setDoc(doc(db('alice'),'sellerProfiles','alice'),pending));await assertFails(setDoc(doc(db('alice'),'sellerProfiles','alice'),{...pending,approved:true}))
 const ref=doc(db('seller-a',claims),'sellerProfiles','seller-a')
 await assertFails(updateDoc(ref,{approved:false,updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{suspended:false,updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{name:'Updated Store',updatedAt:serverTimestamp()}))
 await env.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'sellerProfiles','seller-a'),{suspended:true}))
 await assertFails(updateDoc(doc(db('seller-a',claims),'products','published'),{stock:1,updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{name:'Blocked',updatedAt:serverTimestamp()}))
})

test('customer orders and seller fulfillment records do not leak across accounts or roles',async()=>{
 await assertSucceeds(getDoc(doc(db('alice'),'orders','order-a')));await assertFails(getDoc(doc(db('bob'),'orders','order-a')));await assertFails(getDoc(doc(db('seller-a',claims),'orders','order-a')));await assertFails(updateDoc(doc(db('alice'),'orders','order-a'),{total:0}));await assertFails(setDoc(doc(db('alice'),'orders','forged'),{customerId:'alice',total:0}))
 await assertSucceeds(getDoc(doc(db('seller-a',claims),'sellerFulfillments','fulfillment-a')));await assertFails(getDoc(doc(db('seller-b',claims),'sellerFulfillments','fulfillment-a')));await assertFails(getDoc(doc(db('alice'),'sellerFulfillments','fulfillment-a')));await assertFails(updateDoc(doc(db('seller-a',claims),'sellerFulfillments','fulfillment-a'),{status:'Delivered'}))
 await assertSucceeds(getDoc(doc(db('seller-a',claims),'orderItems','order-a_firestore:published')));await assertFails(getDoc(doc(db('seller-b',claims),'orderItems','order-a_firestore:published')))
})
test('reviews require a delivered owned item and cannot self-publish',async()=>{
 const data={customerId:'alice',productId:'firestore:published',orderId:'order-a',rating:5,body:'Great',status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()},ref=doc(db('alice'),'reviews','alice_firestore:published')
 await assertSucceeds(setDoc(ref,data));await assertFails(getDoc(doc(db(),'reviews','alice_firestore:published')));await assertFails(updateDoc(ref,{status:'published',updatedAt:serverTimestamp()}));await assertFails(setDoc(doc(db('bob'),'reviews','bob_firestore:published'),{...data,customerId:'bob'}));await assertFails(setDoc(doc(db('alice'),'reviews','alice_firestore:missing'),{...data,productId:'firestore:missing'}))
})

test('valid maximum-sized addresses, images, and specifications remain writable',async()=>{
 const addresses=Array.from({length:10},(_,i)=>({id:String(i),fullName:'Alice',phone:'123',address:'Street',city:'City',state:'State',postalCode:'123',country:'Country'}))
 await assertSucceeds(setDoc(doc(db('alice'),'users','alice'),{uid:'alice',displayName:'Alice',email:'alice@example.test',avatar:'',phone:'',profileComplete:true,preferences:{newsletter:false,orderUpdates:true},addresses,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}))
 await assertFails(setDoc(doc(db('seller-a',claims),'products','full-listing'),{...product,images:Array.from({length:6},(_,i)=>({id:String(i),url:'https://example.test/photo.jpg',name:'Photo'})),specifications:Array.from({length:10},(_,i)=>({key:String(i),value:'Value'})),createdAt:serverTimestamp(),updatedAt:serverTimestamp()}))
 await assertSucceeds(updateDoc(doc(db('alice'),'users','alice'),{phone:'456',updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(db('seller-a',claims),'products','full-listing'),{stock:9,updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(db('alice'),'users','alice'),{addresses:[...addresses,addresses[0]],updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(db('alice'),'users','alice'),{addresses:[{...addresses[0],phone:123}],updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(db('alice'),'users','alice'),{addresses:[{...addresses[0],extra:'bad'}],updatedAt:serverTimestamp()}))
 await assertFails(updateDoc(doc(db('seller-a',claims),'products','full-listing'),{specifications:[{key:'Size',value:123}],updatedAt:serverTimestamp()}))
})

