import type { AuthAdapter, AuthProfileInput, AuthSession, AuthUser } from '../../src/features/auth/types.ts'
const LOCAL_KEY='shopsphere-auth-local-v1',SESSION_KEY='shopsphere-auth-session-v1'
const DEMO_PASSWORD='ShopSphere123!'
const delay=()=>new Promise<void>(resolve=>window.setTimeout(resolve,550))
function makeUser(email:string,displayName:string,role:AuthUser['role']='customer',sellerVerified=false,profileComplete=true):AuthUser{return {id:`mock:${email.toLowerCase()}`,email:email.toLowerCase(),displayName,phone:'',avatar:'',role,sellerVerified,profileComplete,preferences:{newsletter:false,orderUpdates:true}}}
/** Passwords exist only in memory for UI simulation and never enter storage or a network request. */
const accounts=new Map<string,{user:AuthUser;password:string}>([
 ['alex@example.com',{user:makeUser('alex@example.com','Alex Morgan'),password:DEMO_PASSWORD}],
 ['seller@example.com',{user:makeUser('seller@example.com','Alex Seller','seller',true),password:DEMO_PASSWORD}],
 ['pending-seller@example.com',{user:makeUser('pending-seller@example.com','Pending Seller','seller',false),password:DEMO_PASSWORD}],
])
let session:AuthSession|null=null,initialized=false
const listeners=new Set<(session:AuthSession|null)=>void>()
function validSession(value:unknown):value is AuthSession{if(!value||typeof value!=='object')return false;const s=value as AuthSession,u=s.user;return !!u&&typeof u.id==='string'&&typeof u.email==='string'&&typeof u.displayName==='string'&&typeof u.phone==='string'&&typeof u.avatar==='string'&&['customer','seller'].includes(u.role)&&typeof u.sellerVerified==='boolean'&&typeof u.profileComplete==='boolean'&&!!u.preferences&&typeof u.preferences.newsletter==='boolean'&&typeof u.preferences.orderUpdates==='boolean'&&typeof s.remember==='boolean'}
function restore(){if(initialized)return;initialized=true;try{const raw=localStorage.getItem(LOCAL_KEY)||sessionStorage.getItem(SESSION_KEY);if(raw){const parsed:unknown=JSON.parse(raw);session=validSession(parsed)?parsed:null}}catch{session=null}}
function publish(){for(const listener of listeners)listener(session)}
function persist(next:AuthSession|null){
 // Write the intended session first so a failed write cannot silently authenticate.
 try{if(next){const target=next.remember?localStorage:sessionStorage;target.setItem(next.remember?LOCAL_KEY:SESSION_KEY,JSON.stringify(next));(next.remember?sessionStorage:localStorage).removeItem(next.remember?SESSION_KEY:LOCAL_KEY)}else{localStorage.removeItem(LOCAL_KEY);sessionStorage.removeItem(SESSION_KEY)}}catch{if(next)throw new Error('Your browser could not save the demo session. Enable browser storage or free some space, then try again.')}
 session=next;publish()
}
export const mockAuthAdapter:AuthAdapter={
 subscribe:listener=>{restore();listeners.add(listener);queueMicrotask(()=>{if(listeners.has(listener))listener(session)});return()=>{listeners.delete(listener)}},
 signIn:async(email,password,remember)=>{await delay();const account=accounts.get(email.trim().toLowerCase());if(!account||account.password!==password)throw new Error('Email or password is incorrect. Use a sample account, or register a mock account. Newly registered credentials last until refresh.');persist({user:{...account.user},remember});return account.user},
 register:async(name,email,password)=>{await delay();const key=email.trim().toLowerCase();if(accounts.has(key))throw new Error('That email already has a mock account. Sign in instead.');const user=makeUser(key,name.trim(),'customer',false,false);persist({user,remember:false});accounts.set(key,{user,password});return user},
 signInWithGoogle:async remember=>{await delay();const user=makeUser('google.shopper@example.com','Google Shopper','customer',false,false);persist({user,remember});return user},
 sendPasswordReset:async()=>{await delay();/* UI simulation only: no email, token or account change. */},
 updateProfile:async(input:AuthProfileInput)=>{await delay();if(!session)throw new Error('Please sign in again to complete your profile.');const user={...session.user,...input,profileComplete:true};persist({user,remember:session.remember});const account=accounts.get(user.email);if(account)accounts.set(user.email,{...account,user});return user},
 signOut:()=>{persist(null)},
}
