import {v2 as cloudinary} from 'cloudinary'
import {randomUUID} from 'node:crypto'
import {FieldValue,Timestamp} from 'firebase-admin/firestore'
import {ApiError} from './errors.ts'
import {getAdminServices} from './firebaseAdmin.ts'
import type {OperationRequest} from './operations.ts'

export const MAX_IMAGE_BYTES=8*1024*1024
export function cloud(){
 const cloud_name=process.env.CLOUDINARY_CLOUD_NAME,api_key=process.env.CLOUDINARY_API_KEY,api_secret=process.env.CLOUDINARY_API_SECRET
 if(!cloud_name||!api_key||!api_secret)throw new ApiError('unavailable','Image storage is not configured on the server.')
 cloudinary.config({cloud_name,api_key,api_secret,secure:true});return cloudinary
}
export async function requireSeller(request:OperationRequest){
 const {auth}=request
 if(!auth||auth.token.email_verified!==true||auth.token.role!=='seller'||auth.token.sellerVerified!==true)throw new ApiError('permission-denied','A verified seller account is required.')
 const profile=await getAdminServices().db.doc(`sellerProfiles/${auth.uid}`).get()
 if(profile.data()?.approved!==true||profile.data()?.suspended===true)throw new ApiError('permission-denied','This seller account is not active.')
 return auth.uid
}
export function uploadId(value:unknown):string{if(typeof value!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(value))throw new ApiError('invalid-argument','Invalid image identifier.');return value}
export async function signUpload(request:OperationRequest){
 const uid=await requireSeller(request),{name,type,size}=request.data
 if(typeof name!=='string'||!name||name.length>200||!['image/jpeg','image/png','image/webp'].includes(String(type))||!Number.isInteger(size)||Number(size)<1||Number(size)>MAX_IMAGE_BYTES||Object.keys(request.data).some(key=>!['name','type','size'].includes(key)))throw new ApiError('invalid-argument','Use a JPG, PNG, or WebP image up to 8 MB.')
 const sdk=cloud(),id=randomUUID(),publicId=`binarystore/products/${uid}/${id}`,now=Date.now(),db=getAdminServices().db
 await db.runTransaction(async tx=>{
  const limit=db.doc(`uploadLimits/${uid}`),snapshot=await tx.get(limit),data=snapshot.data(),recent=data&&now-data.start<3600000,count=recent?data.count:0
  if(count>=30)throw new ApiError('failed-precondition','The hourly image upload limit has been reached. Try later.')
  tx.set(limit,{start:recent?data.start:now,count:count+1})
  tx.create(db.doc(`imageUploads/${id}`),{ownerId:uid,publicId,name,state:'pending',createdAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(now+90*60000)})
 })
 const parameters={timestamp:Math.floor(now/1000),public_id:publicId,overwrite:false,allowed_formats:'jpg,jpeg,png,webp',tags:'binarystore'}
 return {id,publicId,cloudName:process.env.CLOUDINARY_CLOUD_NAME,apiKey:process.env.CLOUDINARY_API_KEY,parameters,signature:sdk.utils.api_sign_request(parameters,process.env.CLOUDINARY_API_SECRET!),expiresAt:now+3600000}
}
export async function finalizeUpload(request:OperationRequest){
 const uid=await requireSeller(request),id=uploadId(request.data.id),db=getAdminServices().db,ref=db.doc(`imageUploads/${id}`),record=(await ref.get()).data()
 if(!record||record.ownerId!==uid)throw new ApiError('permission-denied','This image is not yours.')
 if(record.state==='ready')return {id,url:record.url,publicId:record.publicId,name:record.name}
 if(record.state!=='pending'||record.expiresAt.toMillis()<Date.now())throw new ApiError('failed-precondition','This upload has expired or was removed.')
 const asset=await cloud().api.resource(record.publicId,{resource_type:'image',type:'upload'})
 if(!['jpg','jpeg','png','webp'].includes(asset.format)||asset.bytes>MAX_IMAGE_BYTES||!asset.secure_url?.startsWith('https://')){
  await ref.update({state:'deleting'});await destroyAsset(record.publicId);throw new ApiError('invalid-argument','The uploaded image does not meet the format or size limits.')
 }
 await db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.state!=='pending')throw new ApiError('failed-precondition','This upload is no longer available.');tx.update(ref,{url:asset.secure_url,state:'ready',bytes:asset.bytes,format:asset.format})})
 return {id,url:asset.secure_url,publicId:record.publicId,name:record.name}
}
async function destroyAsset(publicId:string){
 // A signature cannot bind resource_type. Clean every possible resource class for this server-assigned ID.
 for(const resource_type of ['image','video','raw'] as const)await cloud().uploader.destroy(publicId,{resource_type,type:'upload',invalidate:true})
}
export async function deleteUpload(request:OperationRequest){
 const uid=await requireSeller(request),id=uploadId(request.data.id),db=getAdminServices().db,ref=db.doc(`imageUploads/${id}`)
 const publicId=await db.runTransaction(async tx=>{
  const record=(await tx.get(ref)).data()
  if(!record||record.ownerId!==uid)throw new ApiError('permission-denied','This image is not yours.')
  if(record.orderReferences>0)throw new ApiError('failed-precondition','This image is retained for existing orders. Remove it from the listing by saving a replacement instead.')
  if(record.state==='attached'){
   const productRef=db.doc(`products/${uploadId(request.data.productId)}`),product=(await tx.get(productRef)).data()
   if(!product||product.ownerId!==uid||record.productId!==productRef.id||!product.images.some((image:{id:string})=>image.id===id))throw new ApiError('permission-denied','This image does not belong to your product.')
   if(product.images.length<=1)throw new ApiError('failed-precondition','Add a replacement before removing the last product image.')
   tx.update(productRef,{images:product.images.filter((image:{id:string})=>image.id!==id),updatedAt:FieldValue.serverTimestamp()})
  }
  tx.update(ref,{state:'deleting'});return record.publicId as string
 })
 await destroyAsset(publicId)
 // Keep the tombstone until the original signature expires; hourly cleanup removes any replayed upload.
 return {ok:true}
}
export async function cleanupUploads(){
 const db=getAdminServices().db,snapshot=await db.collection('imageUploads').where('expiresAt','<=',Timestamp.now()).limit(20).get()
 let cleaned=0
 for(const document of snapshot.docs){
  const claimed=await db.runTransaction(async tx=>{const data=(await tx.get(document.ref)).data();if(!data||data.state==='attached'||data.state==='historical'||data.state==='deleted'||data.orderReferences>0)return null;tx.update(document.ref,{state:'deleting'});return data.publicId as string})
  if(claimed){try{await destroyAsset(claimed);await document.ref.update({state:'deleted',expiresAt:FieldValue.delete()});cleaned++}catch{console.error('Image cleanup will retry',document.id)}}
  else await document.ref.update({expiresAt:FieldValue.delete()})
 }
 return {cleaned}
}
