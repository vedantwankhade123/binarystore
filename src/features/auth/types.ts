export interface AuthUser {
 id:string; email:string; emailVerified?:boolean; displayName:string; phone:string; avatar:string
 role:'customer'|'seller'; sellerVerified:boolean; profileComplete:boolean
 preferences:{newsletter:boolean;orderUpdates:boolean}
 providerIds?:string[]
}
export interface AuthSession {user:AuthUser;remember:boolean}
export interface AuthProfileInput {displayName:string;phone:string;avatar:string;preferences:AuthUser['preferences']}
/** Replace the adapter, not route/UI code, when Firebase is introduced. */
export interface AuthAdapter {
 subscribe:(listener:(session:AuthSession|null)=>void,onError?:(error:Error)=>void)=>()=>void
 signIn:(email:string,password:string,remember:boolean)=>Promise<AuthUser>
 register:(name:string,email:string,password:string)=>Promise<AuthUser>
 signInWithGoogle:(remember:boolean)=>Promise<AuthUser>
 sendPasswordReset:(email:string)=>Promise<void>
 updateProfile:(input:AuthProfileInput)=>Promise<AuthUser>
 sendVerification?:()=>Promise<void>
 refreshSession?:()=>Promise<void>
 linkGoogle?:()=>Promise<void>
 setPassword?:(password:string)=>Promise<void>
 signOut:()=>void|Promise<void>
}
