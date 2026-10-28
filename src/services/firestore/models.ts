import type { Timestamp } from 'firebase/firestore'
import type { Address, CartLine, PaymentMethod } from '../../types/customer'
import type { Product } from '../../types/product'
export interface UserDocument {uid:string;displayName:string;email:string;avatar:string;phone:string;profileComplete:boolean;preferences:{newsletter:boolean;orderUpdates:boolean};addresses:Address[];createdAt:Timestamp;updatedAt:Timestamp}
export interface ProductDocument {ownerId:string;source:'seller'|'fakestore';externalId:string|null;title:string;description:string;category:string;price:number;discountPrice:number|null;sku:string;stock:number;images:{id:string;url:string;name:string}[];status:'published'|'draft'|'archived';specifications:{key:string;value:string}[];rating:number;reviews:number;createdAt:Timestamp;updatedAt:Timestamp}
export interface CartDocument {ownerId:string;updatedAt:Timestamp}
export interface CartItemDocument {product:Product;quantity:number;updatedAt:Timestamp}
export interface WishlistDocument {ownerId:string;updatedAt:Timestamp}
export interface WishlistItemDocument {product:Product;updatedAt:Timestamp}
export interface OrderDocument {customerId:string;createdAt:Timestamp;items:CartLine[];shippingAddress:Address;paymentMethod:PaymentMethod;subtotal:number;shipping:number;total:number;status:string;demo:boolean;requestId:string}
export interface OrderItemDocument {orderId:string;customerId:string;sellerId:string|null;productId:string;title:string;quantity:number;price:number;createdAt:Timestamp}
export interface SellerProfileDocument {ownerId:string;approved:boolean;requestedAt:Timestamp;updatedAt:Timestamp;name:string;description:string;email:string;phone:string;address:string;logo:{id:string;url:string;name:string}[];notifications:{orders:boolean;lowStock:boolean;weeklyReport:boolean}}
export interface ReviewDocument {customerId:string;productId:string;orderId:string;rating:number;body:string;status:'pending'|'published';createdAt:Timestamp;updatedAt:Timestamp}
