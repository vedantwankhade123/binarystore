export type ListingStatus = 'Active' | 'Draft' | 'Archived'
export type FulfillmentStatus = 'Placed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered'
export interface SellerImage { id:string; url:string; name:string; publicId?:string }
export interface SellerProduct { id:string; title:string; description:string; category:string; price:number; discountPrice:number|null; sku:string; stock:number; images:SellerImage[]; status:ListingStatus; specifications:{key:string;value:string}[]; createdAt:string }
export interface SellerOrder { id:string; customer:string; email:string; address:string; date:string; payment:'Cash on Delivery'; status:FulfillmentStatus; items:{productId:string;title:string;category:string;image:string;price:number;quantity:number}[]; activity:{status:FulfillmentStatus;at:string}[] }
export interface SellerSettings { name:string; description:string; email:string; phone:string; address:string; logo:SellerImage[]; notifications:{orders:boolean;lowStock:boolean;weeklyReport:boolean} }
