import type { Product } from './product'
export interface CartLine { product: Product; quantity: number }
export interface Address { id: string; fullName: string; phone: string; address: string; city: string; state: string; postalCode: string; country: string }
export type OrderStatus = 'Placed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
export type PaymentMethod = 'cod'
export interface Order { id: string; createdAt: string; items: CartLine[]; shippingAddress: Address; paymentMethod: PaymentMethod; subtotal: number; shipping: number; total: number; status: OrderStatus; demo?: boolean }
export interface CustomerProfile { name: string; email: string; phone: string; avatar?: string; addresses: Address[]; preferences: { newsletter: boolean; orderUpdates: boolean } }

export const orderStatuses:OrderStatus[]=['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled']
