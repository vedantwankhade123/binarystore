import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { updatedProfilePhoto } from '../../lib/profilePhoto'
import { persistImage } from '../../lib/firebase/images'
import { db } from '../../lib/firebase/client'
import type { UserDocument } from './models'
import type { AuthProfileInput } from '../../features/auth/types'
import type { Address } from '../../types/customer'
export async function ensureUserProfile(user:User){const ref=doc(db,'users',user.uid);await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);if(!snapshot.exists())transaction.set(ref,{uid:user.uid,displayName:(user.displayName||user.email?.split('@')[0]||'Customer').slice(0,80),email:user.email||'',avatar:user.photoURL||'',phone:'',profileComplete:true,preferences:{newsletter:false,orderUpdates:true},addresses:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});else{const saved=snapshot.data().avatar||'',avatar=updatedProfilePhoto(saved,user.photoURL);if(avatar!==saved)transaction.update(ref,{avatar,updatedAt:serverTimestamp()})}});return getUserProfile(user.uid)}
export async function getUserProfile(uid:string){const snapshot=await getDoc(doc(db,'users',uid));return snapshot.exists()?snapshot.data() as UserDocument:null}
export function observeUserProfile(uid:string,next:(profile:UserDocument|null)=>void,error:(error:Error)=>void){return onSnapshot(doc(db,'users',uid),snapshot=>next(snapshot.exists()?snapshot.data() as UserDocument:null),error)}
export async function updateUserProfile(uid:string,input:AuthProfileInput){const avatar=await persistImage(input.avatar,'avatars');await updateDoc(doc(db,'users',uid),{displayName:input.displayName.trim(),phone:input.phone.trim(),avatar,preferences:input.preferences,profileComplete:true,updatedAt:serverTimestamp()})}
export async function saveUserAddresses(uid:string,addresses:Address[]){if(addresses.length>10)throw new Error('Save up to 10 addresses. Remove an existing address before adding another.');await updateDoc(doc(db,'users',uid),{addresses,updatedAt:serverTimestamp()})}
