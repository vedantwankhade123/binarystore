import type { Address, CartLine, Order, OrderStatus, PaymentMethod } from '../../src/types/customer.ts'
import { calculateTotals } from '../../src/utils/commerce.ts'
const KEY='shopsphere-orders-v1'
export const orderStatuses:OrderStatus[]=['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled']
export function readOrders():Order[]{
 const text=localStorage.getItem(KEY)
 if(!text)return []
 const parsed:unknown=JSON.parse(text)
 if(!Array.isArray(parsed))throw new Error('Saved orders could not be read.')
 return parsed.filter((order):order is Order=>!!order&&typeof order.id==='string'&&typeof order.createdAt==='string'&&Array.isArray(order.items)&&order.items.length>0&&order.items.every((line:CartLine)=>line?.product&&typeof line.product.name==='string'&&typeof line.product.price==='number'&&typeof line.quantity==='number')&&order.shippingAddress&&typeof order.total==='number'&&orderStatuses.includes(order.status))
}
export function createOrder(items:CartLine[],shippingAddress:Address,paymentMethod:PaymentMethod):Order {
 if(!items.length)throw new Error('Your bag is empty. Add a product before checking out.')
 const totals=calculateTotals(items)
 return {id:`DEMO-${crypto.randomUUID().toUpperCase()}`,createdAt:new Date().toISOString(),items:structuredClone(items),shippingAddress:{...shippingAddress},paymentMethod,...totals,status:'Placed',demo:true}
}
/** Save the snapshot before the caller clears the cart; a failed write must leave the bag intact. */
export function saveOrder(order:Order):Order[]{const orders=readOrders();const next=[order,...orders.filter(o=>o.id!==order.id)];localStorage.setItem(KEY,JSON.stringify(next));return next}
export function updateOrderStatus(id:string,status:OrderStatus):Order[]{const orders=readOrders();if(!orders.some(o=>o.id===id))throw new Error('Order not found.');const next=orders.map(o=>o.id===id?{...o,status}:o);localStorage.setItem(KEY,JSON.stringify(next));return next}
