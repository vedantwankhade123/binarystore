import { create } from 'zustand'
import type { Address, CustomerProfile } from '../types/customer'
import { auth, db } from '../lib/firebase/client'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { saveUserAddresses } from '../services/firestore/userService'
const defaultProfile:CustomerProfile={name:'',email:'',phone:'',avatar:'',addresses:[],preferences:{newsletter:false,orderUpdates:true}}
interface CustomerState {profile:CustomerProfile;updateProfile:(profile:CustomerProfile)=>void;saveAddress:(address:Address)=>Promise<void>;removeAddress:(id:string)=>Promise<void>;reset:()=>Promise<void>}
export const useCustomer=create<CustomerState>((set,get)=>({profile:defaultProfile,updateProfile:profile=>set({profile}),saveAddress:async address=>{const uid=auth.currentUser?.uid;if(!uid)throw new Error('Sign in before saving an address.');const profile=get().profile,addresses=profile.addresses.some(a=>a.id===address.id)?profile.addresses.map(a=>a.id===address.id?address:a):[...profile.addresses,address];await saveUserAddresses(uid,addresses)},removeAddress:async id=>{const uid=auth.currentUser?.uid;if(!uid)throw new Error('Sign in before updating addresses.');await saveUserAddresses(uid,get().profile.addresses.filter(a=>a.id!==id))},reset:async()=>{const uid=auth.currentUser?.uid;if(uid)await updateDoc(doc(db,'users',uid),{displayName:'',phone:'',avatar:'',addresses:[],preferences:defaultProfile.preferences,profileComplete:false,updatedAt:serverTimestamp()});set({profile:defaultProfile})}}))
