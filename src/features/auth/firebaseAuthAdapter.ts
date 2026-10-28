import { onIdTokenChanged, browserLocalPersistence, browserSessionPersistence, setPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, linkWithCredential, linkWithPopup, updatePassword, signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile as updateAuthProfile, reload, type User } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { passwordRules } from './schemas'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase/client'
import { firebaseMessage } from '../../lib/firebase/errors'
import { ensureUserProfile, getUserProfile, observeUserProfile, updateUserProfile } from '../../services/firestore/userService'
import type { AuthAdapter, AuthUser } from './types'
import type { UserDocument } from '../../services/firestore/models'
// A pending provider credential stays only in memory until the existing account is authenticated.
class AuthFlowError extends Error {}
let pendingGoogle:{email:string;credential:ReturnType<typeof GoogleAuthProvider.credential>}|null=null
const googleProvider=(email?:string)=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account',...(email?{login_hint:email}:{})});return provider}
async function finishPendingLink(user:User){if(!pendingGoogle||pendingGoogle.email!==user.email?.toLowerCase())return;await linkWithCredential(user,pendingGoogle.credential);pendingGoogle=null;await user.getIdToken(true)}
async function mapUser(user:User,profile:UserDocument|null):Promise<AuthUser>{const token=await user.getIdTokenResult();let approved=false;if(token.claims.role==='seller'&&token.claims.sellerVerified===true&&user.emailVerified){const seller=await getDoc(doc(db,'sellerProfiles',user.uid));approved=seller.exists()&&seller.data().approved===true&&seller.data().suspended!==true}return {id:user.uid,email:user.email||'',emailVerified:user.emailVerified,displayName:profile?.displayName||user.displayName||'',phone:profile?.phone||'',avatar:profile?profile.avatar:user.photoURL||'',role:approved?'seller':'customer',sellerVerified:approved,profileComplete:true,providerIds:user.providerData.map(provider=>provider.providerId),preferences:profile?.preferences||{newsletter:false,orderUpdates:true}}}
async function friendly<T>(operation:()=>Promise<T>):Promise<T>{try{return await operation()}catch(error){if(error instanceof AuthFlowError)throw error;throw new Error(firebaseMessage(error))}}
export const firebaseAuthAdapter:AuthAdapter={
 subscribe:(listener,onError)=>{let cancelProfile:(()=>void)|undefined,revision=0;const stop=onIdTokenChanged(auth,async user=>{const current=++revision;cancelProfile?.();if(!user){listener(null);return}try{await ensureUserProfile(user);if(current!==revision)return;cancelProfile=observeUserProfile(user.uid,async profile=>{try{const mapped=await mapUser(user,profile);if(current===revision)listener({user:mapped,remember:true})}catch(error){onError?.(new Error(firebaseMessage(error)))}},error=>onError?.(new Error(firebaseMessage(error))))}catch(error){if(current===revision){onError?.(new Error(firebaseMessage(error)));listener({user:{id:user.uid,email:user.email||'',emailVerified:user.emailVerified,displayName:user.displayName||'',phone:'',avatar:user.photoURL||'',role:'customer',sellerVerified:false,profileComplete:false,preferences:{newsletter:false,orderUpdates:true}},remember:true})}}},error=>onError?.(new Error(firebaseMessage(error))));return()=>{revision++;stop();cancelProfile?.()}},
 signIn:(email,password,remember)=>friendly(async()=>{await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);const {user}=await signInWithEmailAndPassword(auth,email.trim(),password);await finishPendingLink(user);return mapUser(user,await ensureUserProfile(user))}),
 register:(name,email,password)=>friendly(async()=>{await setPersistence(auth,browserSessionPersistence);const {user}=await createUserWithEmailAndPassword(auth,email,password);await updateAuthProfile(user,{displayName:name});await ensureUserProfile(user);await updateDoc(doc(db,'users',user.uid),{displayName:name,updatedAt:serverTimestamp()});try{await sendEmailVerification(user)}catch{/* Verification can be resent from the verification screen. */}return mapUser(user,await getUserProfile(user.uid))}),
 signInWithGoogle:remember=>friendly(async()=>{
  await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence)
  try{const {user}=await signInWithPopup(auth,googleProvider());pendingGoogle=null;return mapUser(user,await ensureUserProfile(user))}
  catch(error){
   if(error instanceof FirebaseError&&error.code==='auth/account-exists-with-different-credential'){
    const credential=GoogleAuthProvider.credentialFromError(error),email=String(error.customData?.email||'').toLowerCase()
    if(credential&&email){pendingGoogle={email,credential};throw new AuthFlowError('This email already has an account. Log in with its existing password to connect Google to the same account. If you use another sign-in method, sign in with it and connect Google in Settings.')}
   }
   throw error
  }
 }),
 linkGoogle:()=>friendly(async()=>{const user=auth.currentUser;if(!user)throw new AuthFlowError('Sign in again.');if(user.providerData.some(provider=>provider.providerId==='google.com'))return;await linkWithPopup(user,googleProvider(user.email||undefined));await ensureUserProfile(user)}),
 setPassword:password=>friendly(async()=>{const user=auth.currentUser;if(!user?.email)throw new AuthFlowError('Sign in again.');if(password.length>128||!passwordRules.every(rule=>rule.test(password)))throw new AuthFlowError('Use 8–128 characters with uppercase and lowercase letters, a number, and a special character.');await updatePassword(user,password)}),
 sendPasswordReset:async email=>{try{await sendPasswordResetEmail(auth,email)}catch(error){if(!(error&&typeof error==='object'&&'code'in error&&error.code==='auth/user-not-found'))throw new Error(firebaseMessage(error))}},
 updateProfile:input=>friendly(async()=>{const user=auth.currentUser;if(!user)throw new Error('Sign in again.');await updateUserProfile(user.uid,input);await updateAuthProfile(user,{displayName:input.displayName,photoURL:input.avatar||null});return mapUser(user,await getUserProfile(user.uid))}),
 sendVerification:()=>friendly(async()=>{if(!auth.currentUser)throw new Error('Sign in again.');await sendEmailVerification(auth.currentUser)}),
 refreshSession:()=>friendly(async()=>{if(auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true)}}),
 signOut:()=>friendly(async()=>{pendingGoogle=null;await signOut(auth)}),
}
