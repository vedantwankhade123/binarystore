import { create } from 'zustand'
import type { FulfillmentStatus, SellerProduct, SellerOrder, SellerSettings } from '../../types/seller'
import { auth } from '../../lib/firebase/client'
import { saveSellerProduct, archiveSellerProduct } from '../../services/firestore/productService'
import { saveSellerSettings } from '../../services/firestore/sellerService'
import { updateFulfillmentStatus } from '../../services/firestore/orderService'
import { validateListing, validateStoreSettings } from './logic'
import { firebaseMessage } from '../../lib/firebase/errors'
interface SellerState {products:SellerProduct[];orders:SellerOrder[];settings:SellerSettings;notificationsRead:boolean;error:string;loading:boolean;saveProduct:(data:Omit<SellerProduct,'id'|'createdAt'>,id?:string)=>Promise<string>;deleteProduct:(id:string)=>Promise<void>;updateOrder:(id:string,status:FulfillmentStatus)=>Promise<void>;saveSettings:(settings:SellerSettings)=>Promise<SellerSettings>;markNotificationsRead:()=>void}
export const emptySellerSettings:SellerSettings={name:'Your store',description:'',email:'',phone:'',address:'',logo:[],notifications:{orders:true,lowStock:true,weeklyReport:false}}
export const useSeller=create<SellerState>((set,get)=>({products:[],orders:[],settings:structuredClone(emptySellerSettings),notificationsRead:false,error:'',loading:true,
 saveProduct:async(data,id)=>{const error=validateListing(data,get().products,id);if(error)throw new Error(error);try{return await saveSellerProduct(data,id)}catch(error){throw new Error(firebaseMessage(error))}},
 deleteProduct:async id=>{try{await archiveSellerProduct(id)}catch(error){throw new Error(firebaseMessage(error))}},
 updateOrder:async(id,status)=>{try{await updateFulfillmentStatus(id,status)}catch(error){throw new Error(firebaseMessage(error))}},
 saveSettings:async settings=>{const error=validateStoreSettings(settings);if(error)throw new Error(error);const uid=auth.currentUser?.uid;if(!uid)throw new Error('Sign in again.');try{return await saveSellerSettings(uid,settings)}catch(error){throw new Error(firebaseMessage(error))}},
 markNotificationsRead:()=>set({notificationsRead:true}),
}))
