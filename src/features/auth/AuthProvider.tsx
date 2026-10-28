import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './context'
import { firebaseAuthAdapter } from './firebaseAuthAdapter'
import type { AuthAdapter, AuthSession } from './types'
import { useCustomer } from '../../store/customer'
import { observeUserProfile } from '../../services/firestore/userService'
export function AuthProvider({children,adapter=firebaseAuthAdapter}:{children:ReactNode;adapter?:AuthAdapter}){
 const [state,setState]=useState<{session:AuthSession|null;loading:boolean}>({session:null,loading:true}),[error,setError]=useState('')
 useEffect(()=>adapter.subscribe(session=>{setError('');if(!session)useCustomer.getState().updateProfile({name:'',email:'',phone:'',avatar:'',addresses:[],preferences:{newsletter:false,orderUpdates:true}});if(session){const user=session.user,profile=useCustomer.getState().profile;useCustomer.getState().updateProfile({...profile,name:user.displayName,email:user.email,phone:user.phone,avatar:user.avatar,preferences:user.preferences,addresses:profile.email===user.email?profile.addresses:[]})}setState({session,loading:false})},error=>{setError(error.message);setState(s=>({...s,loading:false}))}),[adapter])
 const uid=state.session?.user.id
 useEffect(()=>{if(!uid)return;return observeUserProfile(uid,profile=>{if(profile){useCustomer.getState().updateProfile({name:profile.displayName,email:profile.email,phone:profile.phone,avatar:profile.avatar,preferences:profile.preferences,addresses:profile.addresses||[]})}},error=>setError(error.message))},[uid])
 return <AuthContext.Provider value={{user:state.session?.user??null,loading:state.loading,error,linkGoogle:async()=>{if(!adapter.linkGoogle)throw new Error('Account linking is unavailable.');await adapter.linkGoogle();await adapter.refreshSession?.()},setPassword:async password=>{if(!adapter.setPassword)throw new Error('Password changes are unavailable.');await adapter.setPassword(password);await adapter.refreshSession?.()},signIn:adapter.signIn,register:adapter.register,signInWithGoogle:adapter.signInWithGoogle,sendPasswordReset:adapter.sendPasswordReset,updateProfile:adapter.updateProfile,sendVerification:async()=>{await adapter.sendVerification?.()},refreshSession:async()=>{await adapter.refreshSession?.()},signOut:async()=>{try{await adapter.signOut();setState({session:null,loading:false});return true}catch(error){setError(error instanceof Error?error.message:'Sign-out failed.');return false}}}}>{children}</AuthContext.Provider>
}
