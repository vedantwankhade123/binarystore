import {useEffect} from 'react'
import {useAuth} from '../../features/auth/useAuth'
import {useShop,setShoppingWriter} from '../../hooks/useShop'
import {mergeGuestShopping,observeShopping,writeShoppingChanges} from '../../services/firestore/shoppingService'
import {firebaseMessage} from '../../lib/firebase/errors'
export function ShoppingSync(){
 const {user,loading}=useAuth(),retry=useShop(state=>state.syncRetry),uid=user?.id
 useEffect(()=>{
  let active=true,stop:(()=>void)|undefined
  setShoppingWriter(null)
  const state=useShop.getState()
  if(loading){useShop.setState({syncing:true,pendingWrites:0});return}
  if(!uid){useShop.setState({ownerUid:null,cart:state.guestCart,wishlist:state.guestWishlist,pendingWrites:0,syncing:false,syncError:''});return}
  useShop.setState({ownerUid:uid,cart:[],wishlist:[],pendingWrites:0,syncing:true,syncError:''})
  mergeGuestShopping(uid,state.guestMergeId,state.guestCart,state.guestWishlist).then(()=>{
   if(!active)return
   useShop.setState({guestCart:[],guestWishlist:[]})
   let cartReady=false,wishlistReady=false
   const ready=()=>{
    if(!cartReady||!wishlistReady)return
    useShop.setState({syncing:false})
    setShoppingWriter((before,after)=>{
     useShop.setState(current=>({pendingWrites:current.pendingWrites+1}))
     void writeShoppingChanges(uid,before,after).catch(cause=>{if(active)useShop.setState({syncError:firebaseMessage(cause)})}).finally(()=>{if(active)useShop.setState(current=>({pendingWrites:Math.max(0,current.pendingWrites-1)}))})
    })
   }
   stop=observeShopping(uid,cart=>{if(active){useShop.setState({cart});cartReady=true;ready()}},wishlist=>{if(active){useShop.setState({wishlist});wishlistReady=true;ready()}},cause=>{if(active)useShop.setState({syncing:false,syncError:firebaseMessage(cause)})})
  }).catch(cause=>{if(active)useShop.setState({syncing:false,syncError:firebaseMessage(cause)})})
  return()=>{active=false;setShoppingWriter(null);stop?.();useShop.setState({syncing:true,pendingWrites:0})}
 },[uid,retry,loading])
 return null
}
export function ShoppingStatus(){
 const error=useShop(state=>state.syncError),syncing=useShop(state=>state.syncing),pending=useShop(state=>state.pendingWrites)
 if(error)return <div className="storage-warning" role="alert">{error} <button className="text-button" onClick={()=>useShop.setState(state=>({syncRetry:state.syncRetry+1}))}>Retry bag sync</button></div>
 return syncing||pending>0?<div className="shopping-sync-notice" role="status">{pending>0?'Saving your bag and wishlist…':'Syncing your saved bag and wishlist…'}</div>:null
}
