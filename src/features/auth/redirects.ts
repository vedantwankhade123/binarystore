/** Only permit known internal destinations; never follow an external or auth-loop redirect. */
export function safeDestination(value:unknown):string|null {
 if(typeof value==='string'&&['/seller/login','/seller/register','/seller/forgot-password'].includes(value.split(/[?#]/)[0]))return null
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return null
 try{const url=new URL(value,'https://shopsphere.invalid');if(url.origin!=='https://shopsphere.invalid')return null;if(!/^\/(?:$|shop(?:\/|$)|products(?:\/|$)|cart(?:\/|$)|wishlist(?:\/|$)|checkout(?:\/|$)|orders(?:\/|$)|profile(?:\/|$)|seller(?:\/|$))/.test(url.pathname))return null;return url.pathname+url.search+url.hash}catch{return null}
}
export function authDestination(user:{role:string;sellerVerified:boolean},requested:unknown):string{return safeDestination(requested)??(user.role==='seller'&&user.sellerVerified?'/seller':'/')}
