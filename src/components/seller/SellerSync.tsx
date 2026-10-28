import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { useSeller, emptySellerSettings } from '../../features/seller/store'
import { observeSellerProducts } from '../../services/firestore/productService'
import { observeSellerOrders } from '../../services/firestore/orderService'
import { observeSellerSettings } from '../../services/firestore/sellerService'
import { firebaseMessage } from '../../lib/firebase/errors'
export function SellerSync({children}:{children:ReactNode}){
 const {user}=useAuth(),uid=user?.id,[attempt,setAttempt]=useState(0)
 useEffect(()=>{
  useSeller.setState({products:[],orders:[],settings:structuredClone(emptySellerSettings),notificationsRead:false,loading:true,error:''})
  if(!uid)return
  let active=true
  const ready=new Set<string>(),received=(part:string)=>{ready.add(part);if(active&&ready.size===3)useSeller.setState({loading:false})}
  const failed=(cause:Error)=>{if(active)useSeller.setState({loading:false,error:firebaseMessage(cause)})}
  const a=observeSellerProducts(uid,products=>{if(active){useSeller.setState({products});received('products')}},failed)
  const b=observeSellerOrders(uid,orders=>{if(active){useSeller.setState({orders});received('orders')}},failed)
  const c=observeSellerSettings(uid,settings=>{if(active){if(!settings){useSeller.setState({loading:false,error:'Your store profile could not be loaded. Try again.'});return}useSeller.setState({settings});received('settings')}},failed)
  return()=>{active=false;a();b();c();useSeller.setState({products:[],orders:[],settings:structuredClone(emptySellerSettings),loading:true,error:''})}
 },[uid,attempt])
 const {error,loading}=useSeller()
 if(error)return <main className="container customer-page"><p role="alert">{error}</p><button className="button" onClick={()=>setAttempt(value=>value+1)}>Try again</button></main>
 if(loading)return <p role="status" className="shopping-sync-notice">Loading your seller data…</p>
 return children
}
