import { useFeedback } from '../store/feedback'
import * as externalApi from './productService'
import { fetchPublishedProducts, fetchFirestoreProduct } from './firestore/productService'
let warningShown=false
export async function getAllProducts(){const [external,cloud]=await Promise.allSettled([externalApi.getAllProducts(),fetchPublishedProducts()]);if(external.status==='rejected'&&cloud.status==='rejected')throw cloud.reason;if((external.status==='rejected'||cloud.status==='rejected')&&!warningShown){warningShown=true;useFeedback.getState().notify(external.status==='rejected'?'The Fake Store sample catalog is unavailable. Showing published products.':'Seller products are unavailable. Showing the Fake Store sample catalog.')}if(external.status==='fulfilled'&&cloud.status==='fulfilled')warningShown=false;return [...new Map([...(cloud.status==='fulfilled'?cloud.value:[]),...(external.status==='fulfilled'?external.value:[])].map(p=>[p.id,p])).values()]}

export async function getCategories(){const products=await getAllProducts();return [...new Set(products.map(p=>p.category))]}
export async function getProductById(id:string|number){return String(id).startsWith('firestore:')?fetchFirestoreProduct(String(id).slice(10)):externalApi.getProductById(id)}
export async function getProductsByCategory(category:string){return (await getAllProducts()).filter(p=>p.category===category)}
export { ProductServiceError } from './productService'
