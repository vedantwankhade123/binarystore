import type { FulfillmentStatus, SellerOrder, SellerProduct, SellerSettings } from '../../types/seller'
export const fulfillmentStages:FulfillmentStatus[]=['Placed','Processing','Shipped','Out for Delivery','Delivered']
export const sellerCategories=['Electronics','Fashion','Jewelry','Accessories','Home & Lifestyle']
export const orderTotal=(order:SellerOrder)=>order.items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0)/100
export function sellerMetrics(products:SellerProduct[],orders:SellerOrder[]){return {revenue:orders.filter(order=>order.status==='Delivered').reduce((sum,order)=>sum+Math.round(orderTotal(order)*100),0)/100,orders:orders.length,products:products.length,pending:orders.filter(o=>o.status==='Placed'||o.status==='Processing').length,sales:orders.reduce((sum,o)=>sum+o.items.reduce((n,i)=>n+i.quantity,0),0),lowStock:products.filter(p=>p.status==='Active'&&p.stock<=5)}}
export function topProducts(orders:SellerOrder[]){const totals=new Map<string,{id:string;name:string;image:string;units:number;revenue:number}>();for(const order of orders)for(const item of order.items){const prior=totals.get(item.productId);totals.set(item.productId,{id:item.productId,name:item.title,image:item.image,units:(prior?.units??0)+item.quantity,revenue:(prior?.revenue??0)+item.price*item.quantity})}return [...totals.values()].sort((a,b)=>b.units-a.units||b.revenue-a.revenue)}
export function validateListing(product:Omit<SellerProduct,'id'|'createdAt'>,others:SellerProduct[],id?:string):string {
 if(!product.title.trim()||!product.description.trim()||!product.category.trim()||!product.sku.trim())return 'Complete the title, description, category, and SKU.'
 if(!Number.isFinite(product.price)||product.price<=0)return 'Price must be greater than zero.'
 if(product.discountPrice!==null&&(!Number.isFinite(product.discountPrice)||product.discountPrice<=0||product.discountPrice>=product.price))return 'Discount price must be greater than zero and lower than the regular price.'
 if(!Number.isInteger(product.stock)||product.stock<0)return 'Stock must be a whole number of zero or more.'
 if(others.some(p=>p.id!==id&&p.sku.toLowerCase()===product.sku.trim().toLowerCase()))return 'This SKU is already in use. Choose a unique SKU.'
 if(product.images.some(image=>image.url.startsWith('blob:')))return 'Wait for all images to finish uploading.'
 if(!product.images.length)return 'Add at least one product image.'
 if(product.specifications.length>10)return 'Use up to 10 specifications.'
 if(product.specifications.some(s=>!s.key.trim()||!s.value.trim()))return 'Complete both fields for each specification, or remove the empty row.'
 return ''
}
export function revokeImages(images:{url:string}[]){for(const image of images)if(image.url.startsWith('blob:'))URL.revokeObjectURL(image.url)}

export function sellerRevenueHistory(orders:SellerOrder[],months=6,now=new Date()){
 const history=Array.from({length:months},(_,index)=>{
  const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-months+index+1,1))
  return {key:date.toISOString().slice(0,7),month:date.toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'}),revenue:0,orders:0,deliveredOrders:0}
 })
 for(const order of orders){const month=history.find(entry=>entry.key===order.date.slice(0,7));if(month){if(order.status==='Delivered'){month.revenue+=orderTotal(order);month.deliveredOrders++}month.orders++}}
 return history.map(month=>({...month,revenue:Math.round(month.revenue*100)/100}))
}

export function validateStoreSettings(settings:SellerSettings):string {
 if(!settings.name.trim()||!settings.description.trim()||!settings.address.trim())return 'Complete the store name, description, and business address.'
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email))return 'Enter a valid contact email.'
 return ''
}
