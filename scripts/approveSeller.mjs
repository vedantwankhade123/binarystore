import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { serverApp } from './serverApp.mjs'
const uid=process.argv.find(arg=>arg.startsWith('--uid='))?.slice(6),revoke=process.argv.includes('--revoke')
if(!uid)throw new Error('Usage: node scripts/approveSeller.mjs --uid=FIREBASE_UID [--revoke] [--write]')
const app=await serverApp(),auth=getAuth(app),db=getFirestore(app),user=await auth.getUser(uid),ref=db.doc(`sellerProfiles/${uid}`),profile=await ref.get()
if(!revoke&&(!user.emailVerified||!profile.exists))throw new Error('Seller approval requires a verified email and a submitted seller request.')
if(process.argv.includes('--write')){if(revoke){await ref.update({approved:false,suspended:true,updatedAt:FieldValue.serverTimestamp()});await auth.setCustomUserClaims(uid,{...user.customClaims,role:'customer',sellerVerified:false});await auth.revokeRefreshTokens(uid)}else{await ref.update({approved:true,suspended:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()});await auth.setCustomUserClaims(uid,{...user.customClaims,role:'seller',sellerVerified:true})}}
console.log(JSON.stringify({project:app.options.projectId,uid,action:revoke?'revoke':'approve',mode:process.argv.includes('--write')?'write':'dry-run'}));process.exit(0)
