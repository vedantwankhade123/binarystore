import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { callServerless } from '../../services/serverless'
import { firebaseMessage } from '../../lib/firebase/errors'
import { useAuth } from '../../features/auth/useAuth'
import { AuthFormShell } from '../../components/auth/AuthFormShell'
export function SellerStartPage(){const {user,loading,refreshSession}=useAuth(),[error,setError]=useState(''),[retry,setRetry]=useState(0),started=useRef(false),refreshRef=useRef(refreshSession)
 useEffect(()=>{refreshRef.current=refreshSession},[refreshSession])
 useEffect(()=>{if(!user?.emailVerified||user.sellerVerified||started.current)return;started.current=true;let active=true;callServerless('enrollSeller',{}).then(()=>refreshRef.current()).catch(error=>{if(active){started.current=false;setError(firebaseMessage(error))}});return()=>{active=false;started.current=false}},[user?.id,user?.emailVerified,user?.sellerVerified,retry])
 if(loading)return <div role="status">Restoring your account…</div>
 if(!user)return <Navigate replace to="/seller/login" state={{from:'/seller/start'}}/>
 if(!user.emailVerified)return <Navigate replace to="/auth/verify-email" state={{from:'/seller/start'}}/>
 if(user.sellerVerified)return <Navigate replace to="/seller"/>
 return <AuthFormShell title="Setting up your store." description="Your own dashboard for products, orders, and sales.">{error?<div role="alert"><p>{error}</p><button className="button" onClick={()=>{setError('');setRetry(n=>n+1)}}>Try again</button></div>:<p role="status">Creating your seller workspace…</p>}</AuthFormShell>
}
