import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { ApiError } from './errors.ts'
import { getAdminServices } from './firebaseAdmin.ts'
export interface OperationRequest {auth:{uid:string;token:Record<string,unknown>};data:Record<string,unknown>}
const stages=['Placed','Processing','Shipped','Out for Delivery','Delivered']
const validId=(id:unknown):id is string=>typeof id==='string'&&/^(fakestore:[0-9]+|firestore:[a-zA-Z0-9_-]+)$/.test(id)
function requireCustomer(auth:{uid:string;token:Record<string,unknown>}|undefined){if(!auth)throw new ApiError('unauthenticated','Sign in to continue.');if(auth.token.email_verified!==true)throw new ApiError('permission-denied','Verify your email before placing an order.');return auth.uid}
export async function createOrder(request:OperationRequest){
 const db=getAdminServices().db
 const uid=requireCustomer(request.auth),data=request.data as {requestId?:string;items?:{productId:string;quantity:number}[];shippingAddress?:Record<string,string>;paymentMethod?:string}
 if(typeof data.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.requestId)||!Array.isArray(data.items)||!data.items.length||data.items.length>50)throw new ApiError('invalid-argument','Invalid checkout request.')
 const address=data.shippingAddress;if(!address||!['fullName','phone','address','city','state','postalCode','country'].every(key=>typeof address[key]==='string'&&address[key].trim().length>0&&address[key].length<=200)||data.paymentMethod!=='cod')throw new ApiError('invalid-argument','Complete the shipping address and select Cash on Delivery.')
 const shippingAddress=Object.fromEntries(['id','fullName','phone','address','city','state','postalCode','country'].map(key=>[key,String(address[key]||'').trim()]))
 const ids=new Set<string>();for(const line of data.items)if(!line||!validId(line.productId)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>99||ids.has(line.productId))throw new ApiError('invalid-argument','Invalid or duplicate product quantity.');else ids.add(line.productId)
 if(data.items.some(line=>line.productId.startsWith('fakestore:')))throw new ApiError('failed-precondition','Fake Store sample products cannot be ordered. Choose a seller listing.')
 const orderId=`${uid}_${data.requestId}`,orderRef=db.doc(`orders/${orderId}`),lines=data.items
 await db.runTransaction(async tx=>{
  const existing=await tx.get(orderRef);if(existing.exists)return
  const productRefs=lines.map(l=>db.doc(`products/${l.productId.startsWith('fakestore:')?'fakestore-'+l.productId.slice(10):l.productId.slice(10)}`)),cartRefs=lines.map(l=>db.doc(`carts/${uid}/items/${l.productId}`))
  const snapshots=await tx.getAll(...productRefs,...cartRefs),products=snapshots.slice(0,lines.length),cart=snapshots.slice(lines.length)
  const sellerIds=[...new Set(products.map(p=>p.data()?.ownerId).filter((id):id is string=>typeof id==='string'&&id!=='demo-catalog'))],sellerSnapshots=sellerIds.length?await tx.getAll(...sellerIds.map(id=>db.doc(`sellerProfiles/${id}`))):[]
  if(sellerSnapshots.some(s=>s.data()?.approved!==true||s.data()?.suspended===true))throw new ApiError('failed-precondition','A seller is no longer active.')
  let subtotalCents=0
  const items=lines.map((line,i)=>{const p=products[i].data();if(p&&((line.productId.startsWith('fakestore:')&&(p.source!=='fakestore'||String(p.externalId)!==line.productId.slice(10)))||(line.productId.startsWith('firestore:')&&p.source!=='seller')))throw new ApiError('failed-precondition','The product identifier does not match the catalog source.');if(!p||p.status!=='published'||!Number.isInteger(p.stock)||p.stock<line.quantity)throw new ApiError('failed-precondition','A product is no longer available in the requested quantity.');if(!cart[i].exists||cart[i].data()?.quantity!==line.quantity)throw new ApiError('failed-precondition','Your saved bag changed. Refresh it before checking out.');const price=p.discountPrice??p.price;if(typeof price!=='number'||!Number.isFinite(price)||price<=0)throw new ApiError('failed-precondition','Invalid catalog price.');subtotalCents+=Math.round(price*100)*line.quantity;return {product:{id:line.productId,source:p.source==='fakestore'?{kind:'fakestore',externalId:String(p.externalId)}:{kind:'firestore',listingId:products[i].id,sellerId:p.ownerId},name:p.title,description:p.description,category:p.category,price,rating:p.rating||0,reviews:p.reviews||0,image:p.images[0]?.url||''},quantity:line.quantity}})
  const shippingCents=subtotalCents>=7500?0:595
  tx.create(orderRef,{customerId:uid,createdAt:FieldValue.serverTimestamp(),items,shippingAddress,paymentMethod:data.paymentMethod,subtotal:subtotalCents/100,shipping:shippingCents/100,total:(subtotalCents+shippingCents)/100,status:'Placed',demo:false,paymentStatus:'pending',requestId:data.requestId})
  items.forEach((line,i)=>{const p=products[i].data()!;if(p.images[0]?.publicId)tx.update(db.doc(`imageUploads/${p.images[0].id}`),{orderReferences:FieldValue.increment(1)});tx.update(productRefs[i],{stock:p.stock-line.quantity,updatedAt:FieldValue.serverTimestamp()});tx.delete(cartRefs[i]);tx.create(db.doc(`orderItems/${orderId}_${line.product.id}`),{orderId,customerId:uid,sellerId:p.source==='seller'?p.ownerId:null,productId:line.product.id,title:line.product.name,quantity:line.quantity,price:line.product.price,createdAt:FieldValue.serverTimestamp()})})
  for(const sellerId of sellerIds){const sellerItems=items.filter((_,i)=>products[i].data()?.ownerId===sellerId);tx.create(db.doc(`sellerFulfillments/${orderId}_${sellerId}`),{orderId,sellerId,customer:String(shippingAddress.fullName),email:String(request.auth?.token.email||''),address:Object.values(shippingAddress).filter(Boolean).join(', '),shippingAddress,payment:'Cash on Delivery',items:sellerItems.map(l=>({productId:l.product.id,title:l.product.name,category:l.product.category,image:l.product.image,price:l.product.price,quantity:l.quantity})),status:'Placed',createdAt:FieldValue.serverTimestamp(),activity:[{status:'Placed',at:Timestamp.now()}]})}
 })
 return {orderId}
}
export async function updateFulfillment(request:OperationRequest){
 const db=getAdminServices().db
 const uid=requireCustomer(request.auth);if(request.auth?.token.role!=='seller'||request.auth.token.sellerVerified!==true)throw new ApiError('permission-denied','Verified seller access required.')
 const {id,status}=request.data as {id:string;status:string};if(typeof id!=='string'||!id||id.length>300||id.includes('/')||!stages.includes(status))throw new ApiError('invalid-argument','Invalid fulfillment update.')
 await db.runTransaction(async tx=>{const ref=db.doc(`sellerFulfillments/${id}`),record=await tx.get(ref),seller=await tx.get(db.doc(`sellerProfiles/${uid}`));if(!record.exists||record.data()?.sellerId!==uid||seller.data()?.approved!==true||seller.data()?.suspended===true)throw new ApiError('permission-denied','This fulfillment is not yours.');const data=record.data()!;if(stages.indexOf(status)!==stages.indexOf(data.status)+1)throw new ApiError('failed-precondition','Advance one status at a time.');const siblings=await tx.get(db.collection('sellerFulfillments').where('orderId','==',data.orderId));const next=siblings.docs.map(d=>d.id===id?status:d.data().status);const aggregate=stages[Math.min(...next.map(s=>stages.indexOf(s)))];tx.update(ref,{status,activity:[...data.activity,{status,at:Timestamp.now()}],updatedAt:FieldValue.serverTimestamp()});tx.update(db.doc(`orders/${data.orderId}`),{status:aggregate,updatedAt:FieldValue.serverTimestamp()})})
 return {ok:true}
}
/** Self-service enrollment: identity comes only from the verified Firebase token. */
export async function enrollSeller(request:OperationRequest){
 const db=getAdminServices().db
 const uid=requireCustomer(request.auth),user=await getAdminServices().auth.getUser(uid)
 if(user.disabled||!user.emailVerified)throw new ApiError('permission-denied','Verify your email before starting your store.')
 const ref=db.doc(`sellerProfiles/${uid}`),profileRef=db.doc(`users/${uid}`)
 await db.runTransaction(async tx=>{const existing=await tx.get(ref),profile=await tx.get(profileRef);if(existing.data()?.suspended===true)throw new ApiError('permission-denied','This seller account is suspended. Contact support.');if(!existing.exists)tx.create(ref,{ownerId:uid,approved:true,requestedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),name:`${(profile.data()?.displayName||user.displayName||'My').slice(0,65)}'s store`,description:'',email:user.email||'',phone:'',address:'',logo:[],notifications:{orders:true,lowStock:true,weeklyReport:false}});else tx.update(ref,{approved:true,updatedAt:FieldValue.serverTimestamp()});if(profile.exists)tx.update(profileRef,{profileComplete:true,updatedAt:FieldValue.serverTimestamp()})})
 await getAdminServices().auth.setCustomUserClaims(uid,{...user.customClaims,role:'seller',sellerVerified:true})
 return {ok:true}
}
