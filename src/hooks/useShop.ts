import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product } from '../types/product'
import type { CartLine } from '../types/customer'
import { clampQuantity } from '../utils/commerce'
import { safeStorage, useFeedback } from '../store/feedback'
export interface ShoppingState {
 pendingWrites:number;ownerUid:string|null;syncRetry:number;syncing:boolean;syncError:string;guestCart:CartLine[];guestWishlist:Product[];guestMergeId:string;
 cart: CartLine[]; wishlist: Product[]
 addToCart:(product:Product,quantity?:number)=>void
 setQuantity:(id:string,quantity:number)=>void
 removeFromCart:(id:string)=>void
 clearCart:()=>void
 toggleWishlist:(product:Product)=>void
 moveToCart:(product:Product)=>void
}
function isProduct(p:unknown):p is Product { if(!p||typeof p!=='object')return false;const x=p as Product;return typeof x.id==='string' && typeof x.name==='string' && typeof x.image==='string' && typeof x.category==='string' && typeof x.price==='number' && Number.isFinite(x.price) && x.price>=0 }
function restore(value:unknown){
 const data=(value && typeof value==='object'?value:{}) as Partial<ShoppingState>
 const cart:CartLine[]=[]
 if(Array.isArray(data.cart))for(const line of data.cart){if(!line||!isProduct(line.product)||typeof line.quantity!=='number'||!Number.isFinite(line.quantity))continue;const existing=cart.find(l=>l.product.id===line.product.id);if(existing)existing.quantity=clampQuantity(existing.quantity+line.quantity);else cart.push({product:line.product,quantity:clampQuantity(line.quantity)})}
 const wishlist=Array.isArray(data.wishlist)?[...new Map(data.wishlist.filter(isProduct).map(p=>[p.id,p])).values()]:[]
 return {cart,wishlist}
}
type ShoppingSnapshot={cart:CartLine[];wishlist:Product[]}
let cloudWriter:((before:ShoppingSnapshot,after:ShoppingSnapshot)=>void)|null=null
export function setShoppingWriter(writer:typeof cloudWriter){cloudWriter=writer}
export const useShop = create<ShoppingState>()(persist((baseSet,get)=>{
 const set=(update:Partial<ShoppingState>|((state:ShoppingState)=>Partial<ShoppingState>))=>{const before=get();if(before.syncing||before.pendingWrites>0||before.ownerUid&&(before.syncError||!cloudWriter)){useFeedback.getState().notify('Your saved bag is syncing. Please wait.');return}baseSet(update);const after=get();if(after.ownerUid){cloudWriter?.(before,after)}else{baseSet({guestCart:after.cart,guestWishlist:after.wishlist,guestMergeId:crypto.randomUUID()})}return true}
 return ({
 pendingWrites:0,ownerUid:null,syncRetry:0,syncing:false,syncError:'',guestCart:[],guestWishlist:[],guestMergeId:crypto.randomUUID(),cart:[],wishlist:[],
 addToCart:(product,quantity=1)=>{if(product.source.kind==='fakestore'){useFeedback.getState().notify('Fake Store samples cannot be ordered. Choose a product labeled Real.');return}if(set(state=>{const found=state.cart.some(line=>line.product.id===product.id);return {cart:found?state.cart.map(line=>line.product.id===product.id?{product,quantity:clampQuantity(line.quantity+clampQuantity(quantity))}:line):[...state.cart,{product,quantity:clampQuantity(quantity)}]}}))useFeedback.getState().notify('Added to your bag')},
 setQuantity:(id,quantity)=>set(state=>({cart:state.cart.map(line=>line.product.id===id?{...line,quantity:clampQuantity(quantity)}:line)})),
 removeFromCart:id=>set(state=>({cart:state.cart.filter(line=>line.product.id!==id)})),
 clearCart:()=>set({cart:[]}),
 toggleWishlist:product=>set(state=>({wishlist:state.wishlist.some(p=>p.id===product.id)?state.wishlist.filter(p=>p.id!==product.id):[...state.wishlist,product]})),
 moveToCart:product=>{if(product.source.kind==='fakestore'){useFeedback.getState().notify('Fake Store samples cannot be ordered.');return}set(state=>{const existing=state.cart.find(line=>line.product.id===product.id);return {cart:existing?state.cart.map(line=>line.product.id===product.id?{product,quantity:clampQuantity(line.quantity+1)}:line):[...state.cart,{product,quantity:1}],wishlist:state.wishlist.filter(p=>p.id!==product.id)}})},
})},{name:'shopsphere-shopping-v1',storage:createJSONStorage(()=>safeStorage),partialize:state=>({cart:state.ownerUid?state.guestCart:state.cart,wishlist:state.ownerUid?state.guestWishlist:state.wishlist,guestMergeId:state.guestMergeId}),merge:(persisted,current)=>({...current,...restore(persisted),guestCart:restore(persisted).cart,guestWishlist:restore(persisted).wishlist,guestMergeId:typeof (persisted as Partial<ShoppingState>)?.guestMergeId==='string'?(persisted as ShoppingState).guestMergeId:current.guestMergeId})}))
