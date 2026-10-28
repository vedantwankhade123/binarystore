import test from 'node:test'
import assert from 'node:assert/strict'
import { loginSchema, registerSchema, completeProfileSchema, forgotPasswordSchema } from '../src/features/auth/schemas.ts'
import { safeDestination, authDestination } from '../src/features/auth/redirects.ts'
const signup={name:'Demo Shopper',email:'demo@example.com',password:'ShopSphere123!',confirmPassword:'ShopSphere123!',terms:true}
test('auth schemas validate email, required fields, strength, matching passwords and terms',()=>{
 assert(loginSchema.safeParse({email:'alex@example.com',password:'sample',remember:false}).success)
 assert(!loginSchema.safeParse({email:'not-email',password:'',remember:false}).success)
 assert(registerSchema.safeParse(signup).success)
 for(const password of ['short','alllowercase123!','ALLUPPERCASE123!','NoDigitsHere!','NoSymbols123'])assert(!registerSchema.safeParse({...signup,password,confirmPassword:password}).success)
 assert(!registerSchema.safeParse({...signup,confirmPassword:'Different123!'}).success)
 assert(!registerSchema.safeParse({...signup,terms:false}).success)
 assert(!forgotPasswordSchema.safeParse({email:'bad'}).success)
 assert(completeProfileSchema.safeParse({displayName:'Demo',phone:'+1 (202) 555-0123',newsletter:false,orderUpdates:true}).success)
 assert(completeProfileSchema.safeParse({displayName:'Demo',phone:'',newsletter:false,orderUpdates:true}).success)
 assert(!completeProfileSchema.safeParse({displayName:' ',phone:'abc',newsletter:false,orderUpdates:true}).success)
})
test('post-login redirects preserve valid paths and reject external targets or auth loops',()=>{
 assert.equal(safeDestination('/checkout?step=review#summary'),'/checkout?step=review#summary')
 assert.equal(safeDestination('/seller/products/new'),'/seller/products/new')
 for(const value of ['https://evil.example','//evil.example','/\\evil.example','/login','/register','/forgot-password','/auth/complete-profile','/seller/login','/seller/register','/seller/forgot-password','/seller/../login','javascript:alert(1)',null])assert.equal(safeDestination(value),null)
 assert.equal(authDestination({role:'seller',sellerVerified:true},undefined),'/seller')
 assert.equal(authDestination({role:'seller',sellerVerified:false},undefined),'/')
 assert.equal(authDestination({role:'customer',sellerVerified:false},'/orders'),'/orders')
 assert.equal(authDestination({role:'customer',sellerVerified:false,profileComplete:false},undefined),'/')
})
const memory=()=>{const data=new Map();return{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key),entries:()=>[...data.entries()]}}
async function withBrowser(run){const keys=['window','localStorage','sessionStorage'],prior=keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,'window',{configurable:true,value:{setTimeout:callback=>{queueMicrotask(callback);return 0}}});Object.defineProperty(globalThis,'localStorage',{configurable:true,value:memory()});Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:memory()});try{await run()}finally{keys.forEach((key,i)=>prior[i]?Object.defineProperty(globalThis,key,prior[i]):delete globalThis[key])}}
let instance=0
const service=async()=>(await import(`./fixtures/mockAuthAdapter.ts?case=${instance++}`)).mockAuthAdapter
test('mock sign-in handles credentials, remembered/temporary sessions, verified roles and logout',()=>withBrowser(async()=>{
 const adapter=await service();let state;const unsubscribe=adapter.subscribe(value=>state=value);await Promise.resolve()
 await assert.rejects(()=>adapter.signIn('alex@example.com','wrong',false),/incorrect/)
 assert.equal(state,null)
 const customer=await adapter.signIn('alex@example.com','ShopSphere123!',false);assert.equal(customer.role,'customer');assert.equal(localStorage.entries().length,0);assert.equal(sessionStorage.entries().length,1)
 const seller=await adapter.signIn('seller@example.com','ShopSphere123!',true);assert.equal(seller.sellerVerified,true);assert.equal(sessionStorage.entries().length,0);assert.equal(localStorage.entries().length,1)
 const restored=await service();let restoredState;const unsub=restored.subscribe(value=>restoredState=value);await Promise.resolve();assert.equal(restoredState.user.email,'seller@example.com')
 assert(!JSON.stringify(localStorage.entries()).includes('ShopSphere123!'))
 adapter.signOut();assert.equal(state,null);assert.equal(localStorage.entries().length,0);unsubscribe();unsub()
}))
test('mock registration, profile completion and Google/reset simulations stay local',()=>withBrowser(async()=>{
 const adapter=await service();adapter.subscribe(()=>{});await Promise.resolve()
 const user=await adapter.register('Demo Shopper','new@example.com','ShopSphere123!');assert.equal(user.profileComplete,false);assert.equal(user.role,'customer');assert.equal(user.sellerVerified,false)
 await assert.rejects(()=>adapter.register('Same','new@example.com','ShopSphere123!'),/already/)
 const completed=await adapter.updateProfile({displayName:'Updated',phone:'2025550123',avatar:'',preferences:{newsletter:true,orderUpdates:false}});assert.equal(completed.profileComplete,true);assert.equal(completed.preferences.newsletter,true)
 adapter.signOut();const login=await adapter.signIn('new@example.com','ShopSphere123!',false);assert.equal(login.displayName,'Updated')
 assert(!JSON.stringify(sessionStorage.entries()).includes('ShopSphere123!'))
 await adapter.sendPasswordReset('anyone@example.com');const google=await adapter.signInWithGoogle(false);assert.equal(google.profileComplete,false);assert.equal(google.role,'customer')
}))
test('blocked session storage reports failure without authenticating',()=>withBrowser(async()=>{
 const adapter=await service();let session;adapter.subscribe(value=>session=value);await Promise.resolve();sessionStorage.setItem=()=>{throw new Error('Quota exceeded')}
 await assert.rejects(()=>adapter.signIn('alex@example.com','ShopSphere123!',false),/could not save/);assert.equal(session,null)
}))
