import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore'
import { callServerless } from '../serverless'
import { db } from '../../lib/firebase/client'
import type { Address, CartLine, Order, PaymentMethod } from '../../types/customer'
import type { SellerOrder } from '../../types/seller'
export async function placeFirestoreOrder(items:CartLine[],shippingAddress:Address,paymentMethod:PaymentMethod,requestId:string){return (await callServerless<{orderId:string}>('createOrder',{items:items.map(line=>({productId:line.product.id,quantity:line.quantity})),shippingAddress,paymentMethod,requestId})).orderId}
export function observeCustomerOrders(uid:string,next:(orders:Order[])=>void,error:(error:Error)=>void){return onSnapshot(query(collection(db,'orders'),where('customerId','==',uid)),snapshot=>next(snapshot.docs.filter(d=>d.data().demo!==true).map(d=>{const data=d.data();return {...data,id:d.id,createdAt:(data.createdAt as Timestamp)?.toDate().toISOString()||new Date().toISOString()} as Order}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))),error)}
export function observeSellerOrders(uid:string,next:(orders:SellerOrder[])=>void,error:(error:Error)=>void){return onSnapshot(query(collection(db,'sellerFulfillments'),where('sellerId','==',uid)),snapshot=>next(snapshot.docs.filter(d=>d.data().payment==='Cash on Delivery').map(d=>{const data=d.data();return {...data,id:d.id,date:(data.createdAt as Timestamp)?.toDate().toISOString()||'',activity:(data.activity||[]).map((a:{status:string;at:Timestamp})=>({status:a.status,at:a.at.toDate().toISOString()}))} as SellerOrder})),error)}
export async function updateFulfillmentStatus(id:string,status:string){await callServerless('updateFulfillment',{id,status})}
