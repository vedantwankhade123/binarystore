import { collection, doc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase/client'
export async function getPublishedReviews(productId:string){return getDocs(query(collection(db,'reviews'),where('productId','==',productId),where('status','==','published')))}
export async function submitReview(productId:string,orderId:string,rating:number,body:string){const uid=auth.currentUser?.uid;if(!uid)throw new Error('Sign in before reviewing.');await setDoc(doc(db,'reviews',`${uid}_${productId}`),{customerId:uid,productId,orderId,rating,body,status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}
