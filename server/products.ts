import {z} from 'zod'
import {FieldValue} from 'firebase-admin/firestore'
import {getAdminServices} from './firebaseAdmin.ts'
import {ApiError} from './errors.ts'
import {requireSeller,uploadId} from './media.ts'
import type {OperationRequest} from './operations.ts'

const image=z.object({id:z.string().min(1).max(100),url:z.string().url().max(2048).startsWith('https://'),name:z.string().max(200),publicId:z.string().max(240).optional()}).strict()
const listing=z.object({title:z.string().trim().min(1).max(150),description:z.string().trim().min(1).max(5000),category:z.string().trim().min(1).max(80),price:z.number().positive().max(1000000),discountPrice:z.number().positive().nullable(),sku:z.string().trim().min(1).max(60),stock:z.number().int().min(0).max(1000000),status:z.enum(['Active','Draft','Archived']),images:z.array(image).min(1).max(6),specifications:z.array(z.object({key:z.string().min(1).max(80),value:z.string().min(1).max(200)}).strict()).max(10)}).strict().refine(data=>data.discountPrice===null||data.discountPrice<data.price)
export async function saveProduct(request:OperationRequest){
 const uid=await requireSeller(request),parsed=listing.safeParse(request.data.product)
 if(!parsed.success)throw new ApiError('invalid-argument',parsed.error.issues[0].message)
 const data=parsed.data,db=getAdminServices().db,ref=request.data.id?db.doc(`products/${uploadId(request.data.id)}`):db.collection('products').doc()
 if(new Set(data.images.map(asset=>asset.id)).size!==data.images.length)throw new ApiError('invalid-argument','Each image must be unique.')
 await db.runTransaction(async tx=>{
  const prior=(await tx.get(ref)).data()
  if(request.data.id&&(!prior||prior.ownerId!==uid||prior.source!=='seller'))throw new ApiError('permission-denied','This product does not belong to you.')
  const records=await Promise.all(data.images.filter(asset=>asset.publicId).map(asset=>tx.get(db.doc(`imageUploads/${uploadId(asset.id)}`))))
  for(const record of records){const asset=record.data(),selected=data.images.find(item=>item.id===record.id)!;if(!asset||asset.ownerId!==uid||!['ready','attached'].includes(asset.state)||asset.state==='attached'&&asset.productId!==ref.id||asset.url!==selected.url||asset.publicId!==selected.publicId)throw new ApiError('permission-denied','An image is not available for this product.')}
  const removed=(prior?.images||[]).filter((asset:{id:string;publicId?:string})=>asset.publicId&&!data.images.some(item=>item.id===asset.id))
  const removedRefs=await Promise.all(removed.map((asset:{id:string})=>tx.get(db.doc(`imageUploads/${uploadId(asset.id)}`))))
  const payload={...data,status:data.status==='Active'?'published':data.status==='Archived'?'archived':'draft',updatedAt:FieldValue.serverTimestamp()}
  if(prior)tx.update(ref,payload);else tx.create(ref,{...payload,ownerId:uid,source:'seller',externalId:null,rating:0,reviews:0,createdAt:FieldValue.serverTimestamp()})
  for(const record of records)tx.update(record.ref,{state:'attached',productId:ref.id,expiresAt:FieldValue.delete()})
  for(const record of removedRefs)if(record.data()?.ownerId===uid&&record.data()?.productId===ref.id)tx.update(record.ref,record.data()?.orderReferences>0?{state:'historical',expiresAt:FieldValue.delete()}:{state:'deleting',expiresAt:record.data()?.createdAt?new Date(record.data()!.createdAt.toMillis()+90*60000):new Date(Date.now()+90*60000)})
 })
 return {id:ref.id}
}
export async function archiveProduct(request:OperationRequest){
 const uid=await requireSeller(request),db=getAdminServices().db,ref=db.doc(`products/${uploadId(request.data.id)}`)
 await db.runTransaction(async tx=>{const product=(await tx.get(ref)).data();if(!product||product.ownerId!==uid||product.source!=='seller')throw new ApiError('permission-denied','This product does not belong to you.');tx.update(ref,{status:'archived',updatedAt:FieldValue.serverTimestamp()})})
 // Keep historical image URLs for previous orders; archive is deliberately not a hard delete.
 return {ok:true}
}

export async function saveStoreSettings(request:OperationRequest){
 const uid=await requireSeller(request),schema=z.object({name:z.string().trim().min(1).max(80),description:z.string().max(1000),email:z.string().email().max(120),phone:z.string().max(25),address:z.string().max(500),logo:z.array(image).max(1),notifications:z.object({orders:z.boolean(),lowStock:z.boolean(),weeklyReport:z.boolean()}).strict()}).strict(),parsed=schema.safeParse(request.data.settings)
 if(!parsed.success)throw new ApiError('invalid-argument','Complete your store information with valid values.')
 const data=parsed.data,db=getAdminServices().db,ref=db.doc(`sellerProfiles/${uid}`)
 await db.runTransaction(async tx=>{
  const prior=(await tx.get(ref)).data(),selected=data.logo[0]
  const receipt=selected?.publicId?await tx.get(db.doc(`imageUploads/${uploadId(selected.id)}`)):null
  const old=(prior?.logo||[]).filter((asset:{id:string;publicId?:string})=>asset.publicId&&asset.id!==selected?.id)
  const oldRecords=await Promise.all(old.map((asset:{id:string})=>tx.get(db.doc(`imageUploads/${uploadId(asset.id)}`))))
  if(receipt){const asset=receipt.data();if(!asset||asset.ownerId!==uid||asset.url!==selected!.url||asset.publicId!==selected!.publicId||!['ready','attached'].includes(asset.state)||asset.state==='attached'&&asset.productId!==`store:${uid}`)throw new ApiError('permission-denied','This store image is not yours.')}
  tx.update(ref,{...data,updatedAt:FieldValue.serverTimestamp()})
  if(receipt)tx.update(receipt.ref,{state:'attached',productId:`store:${uid}`,expiresAt:FieldValue.delete()})
  for(const record of oldRecords)if(record.data()?.ownerId===uid)tx.update(record.ref,{state:'deleting',expiresAt:new Date(Date.now()+90*60000)})
 })
 return data
}
