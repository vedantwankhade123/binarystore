import { collection, doc, onSnapshot, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase/client'
import type { CartLine } from '../../types/customer'
import type { Product } from '../../types/product'
export async function mergeGuestShopping(uid:string,mergeId:string,cart:CartLine[],wishlist:Product[]){
 if(cart.length+wishlist.length>200)throw new Error('Reduce the guest bag and wishlist to 200 unique items before syncing.')
 const marker=doc(db,'carts',uid,'merges',mergeId)
 await runTransaction(db,async transaction=>{
  const prior=await transaction.get(marker);if(prior.exists())return
  const refs=cart.map(line=>doc(db,'carts',uid,'items',line.product.id)),existing=await Promise.all(refs.map(ref=>transaction.get(ref)))
  cart.forEach((line,i)=>transaction.set(refs[i],{product:JSON.parse(JSON.stringify(line.product)),quantity:Math.min(99,(existing[i].data()?.quantity||0)+line.quantity),updatedAt:serverTimestamp()}))
  wishlist.forEach(product=>transaction.set(doc(db,'wishlists',uid,'items',product.id),{product:JSON.parse(JSON.stringify(product)),updatedAt:serverTimestamp()}))
  transaction.set(doc(db,'carts',uid),{ownerId:uid,updatedAt:serverTimestamp()},{merge:true});transaction.set(doc(db,'wishlists',uid),{ownerId:uid,updatedAt:serverTimestamp()},{merge:true})
  transaction.set(marker,{createdAt:serverTimestamp()})
 })
}
export function observeShopping(uid:string,nextCart:(cart:CartLine[])=>void,nextWishlist:(wishlist:Product[])=>void,error:(e:Error)=>void){const a=onSnapshot(collection(db,'carts',uid,'items'),snapshot=>nextCart(snapshot.docs.map(d=>({product:d.data().product as Product,quantity:d.data().quantity as number}))),error);const b=onSnapshot(collection(db,'wishlists',uid,'items'),snapshot=>nextWishlist(snapshot.docs.map(d=>d.data().product as Product)),error);return()=>{a();b()}}
export async function writeShoppingChanges(uid:string,before:{cart:CartLine[];wishlist:Product[]},after:{cart:CartLine[];wishlist:Product[]}){const batch=writeBatch(db);for(const line of before.cart)if(!after.cart.some(l=>l.product.id===line.product.id))batch.delete(doc(db,'carts',uid,'items',line.product.id));for(const line of after.cart)if(JSON.stringify(before.cart.find(l=>l.product.id===line.product.id))!==JSON.stringify(line))batch.set(doc(db,'carts',uid,'items',line.product.id),{...JSON.parse(JSON.stringify(line)),updatedAt:serverTimestamp()});for(const p of before.wishlist)if(!after.wishlist.some(i=>i.id===p.id))batch.delete(doc(db,'wishlists',uid,'items',p.id));for(const product of after.wishlist)if(!before.wishlist.some(p=>p.id===product.id))batch.set(doc(db,'wishlists',uid,'items',product.id),{product:JSON.parse(JSON.stringify(product)),updatedAt:serverTimestamp()});await batch.commit()}
