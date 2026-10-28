import { createContext } from 'react'
import type { AuthProfileInput, AuthUser } from './types'
export interface AuthContextValue {user:AuthUser|null;loading:boolean;error:string;sendVerification:()=>Promise<void>;refreshSession:()=>Promise<void>;linkGoogle:()=>Promise<void>;setPassword:(password:string)=>Promise<void>;signIn:(email:string,password:string,remember:boolean)=>Promise<AuthUser>;register:(name:string,email:string,password:string)=>Promise<AuthUser>;signInWithGoogle:(remember:boolean)=>Promise<AuthUser>;sendPasswordReset:(email:string)=>Promise<void>;updateProfile:(input:AuthProfileInput)=>Promise<AuthUser>;signOut:()=>Promise<boolean>}
export const AuthContext=createContext<AuthContextValue|null>(null)
