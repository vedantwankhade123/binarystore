import {callServerless} from './serverless'
import type {SellerImage} from '../types/seller'

export const IMAGE_LIMIT=8*1024*1024
export function validateImage(file:Pick<File,'type'|'size'>){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>IMAGE_LIMIT)throw new Error('Choose JPG, PNG, or WebP images up to 8 MB each.')}
interface UploadSignature {id:string;publicId:string;cloudName:string;apiKey:string;signature:string;parameters:Record<string,string|number|boolean>}
export async function uploadImage(file:File,progress:(percent:number)=>void,signal:AbortSignal):Promise<SellerImage>{
 validateImage(file)
 const signed=await callServerless<UploadSignature>('signUpload',{name:file.name,type:file.type,size:file.size})
 try{
  if(signal.aborted)throw new Error('Upload cancelled.')
  const body=new FormData();body.append('file',file);body.append('api_key',signed.apiKey);body.append('signature',signed.signature)
  for(const [key,value]of Object.entries(signed.parameters))body.append(key,String(value))
  await new Promise<void>((resolve,reject)=>{
   const xhr=new XMLHttpRequest(),abort=()=>xhr.abort()
   xhr.open('POST',`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`);xhr.timeout=120000
   xhr.upload.onprogress=event=>{if(event.lengthComputable)progress(Math.round(event.loaded/event.total*95))}
   const finish=()=>signal.removeEventListener('abort',abort)
   xhr.onload=()=>{finish();if(xhr.status>=200&&xhr.status<300)resolve();else reject(new Error('Cloudinary could not upload this image. Please retry.'))}
   xhr.onerror=xhr.ontimeout=()=>{finish();reject(new Error('Image upload failed. Check your connection and retry.'))}
   xhr.onabort=()=>{finish();reject(new Error('Upload cancelled.'))};signal.addEventListener('abort',abort,{once:true});xhr.send(body)
  })
  const result=await callServerless<SellerImage>('finalizeUpload',{id:signed.id});progress(100);return result
 }catch(error){void discardImage(signed.id);throw error}
}
export async function discardImage(id:string){try{await callServerless('deleteUpload',{id})}catch{/* The server retains the reservation for scheduled cleanup. */}}
