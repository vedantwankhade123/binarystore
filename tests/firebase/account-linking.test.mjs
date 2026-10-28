import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp, deleteApp } from 'firebase/app'
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, linkWithCredential, signInWithCredential, signInWithEmailAndPassword, signOut, GoogleAuthProvider, updatePassword } from 'firebase/auth'

const projectId='demo-shopsphere'
function googleCredential(email,sub){
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url')
 return GoogleAuthProvider.credential(`${encode({alg:'none',typ:'JWT'})}.${encode({sub,email,email_verified:true,name:'Linked Customer',iss:'https://accounts.google.com',aud:'demo-client'})}.`)
}
test('password and Google sign-in preserve one UID, profile, and saved cart after linking',async()=>{
 const admin=initializeAdmin({projectId},'account-linking'),adminAuth=getAdminAuth(admin),db=getAdminFirestore(admin),app=initializeApp({apiKey:'demo-api-key',projectId},'account-linking-client'),auth=getAuth(app)
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true})
 const email=`linked-${Date.now()}@example.test`,password='Tutorial123!',{user}=await createUserWithEmailAndPassword(auth,email,password),uid=user.uid
 try{
  await adminAuth.updateUser(uid,{emailVerified:true})
  await db.doc(`users/${uid}`).set({displayName:'Existing profile'})
  await db.doc(`carts/${uid}/items/fakestore:1`).set({quantity:2})
  const google=googleCredential(email,`google-${uid}`)
  await linkWithCredential(user,google)
  await signOut(auth)
  const signedInWithGoogle=await signInWithCredential(auth,google)
  assert.equal(signedInWithGoogle.user.uid,uid)
  assert.deepEqual(signedInWithGoogle.user.providerData.map(provider=>provider.providerId).sort(),['google.com','password'])
  await signOut(auth)
  assert.equal((await signInWithEmailAndPassword(auth,email,password)).user.uid,uid)
  assert.equal((await db.doc(`users/${uid}`).get()).data().displayName,'Existing profile')
  assert.equal((await db.doc(`carts/${uid}/items/fakestore:1`).get()).data().quantity,2)
 }finally{await adminAuth.deleteUser(uid);await db.doc(`users/${uid}`).delete();await db.doc(`carts/${uid}/items/fakestore:1`).delete();await deleteApp(app);await deleteAdmin(admin)}
})

test('Google-created users can add password sign-in without creating another account',async()=>{
 const app=initializeApp({apiKey:'demo-api-key',projectId},'google-first'),auth=getAuth(app),admin=initializeAdmin({projectId},'google-first-admin'),adminAuth=getAdminAuth(admin)
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true})
 const email=`google-first-${Date.now()}@example.test`,google=googleCredential(email,`google-first-${Date.now()}`),{user}=await signInWithCredential(auth,google),uid=user.uid
 try{
  assert.equal(user.email,email)
  await updatePassword(user,'Tutorial123!')
  await signOut(auth)
  assert.equal((await signInWithEmailAndPassword(auth,email,'Tutorial123!')).user.uid,uid)
  await signOut(auth)
  assert.equal((await signInWithCredential(auth,google)).user.uid,uid)
 }finally{await adminAuth.deleteUser(uid);await deleteApp(app);await deleteAdmin(admin)}
})

test('verified password signup followed by trusted Google sign-in reuses the same account',async()=>{
 const app=initializeApp({apiKey:'demo-api-key',projectId},'password-then-google'),auth=getAuth(app),admin=initializeAdmin({projectId},'password-google-admin'),adminAuth=getAdminAuth(admin)
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true})
 const email=`binary-tutorial-${Date.now()}@gmail.com`,{user}=await createUserWithEmailAndPassword(auth,email,'Tutorial123!'),uid=user.uid
 try{
  await adminAuth.updateUser(uid,{emailVerified:true});await signOut(auth)
  assert.equal((await signInWithCredential(auth,googleCredential(email,`trusted-${uid}`))).user.uid,uid)
  await signOut(auth)
  assert.equal((await signInWithEmailAndPassword(auth,email,'Tutorial123!')).user.uid,uid)
 }finally{await adminAuth.deleteUser(uid);await deleteApp(app);await deleteAdmin(admin)}
})
