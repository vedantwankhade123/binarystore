import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase/client'
import { callServerless } from '../serverless'
import type { SellerSettings } from '../../types/seller'
export function observeSellerSettings(uid:string,next:(settings:SellerSettings|null)=>void,error:(error:Error)=>void){return onSnapshot(doc(db,'sellerProfiles',uid),snapshot=>{next(snapshot.exists()?snapshot.data() as SellerSettings:null)},error)}
export async function saveSellerSettings(_uid:string,settings:SellerSettings){return callServerless<SellerSettings>('saveStoreSettings',{settings})}
