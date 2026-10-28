import { create } from 'zustand'
import type { Order } from '../types/customer'
interface OrdersState {orders:Order[];error:string;loading:boolean;refresh:()=>void}
export const useOrders=create<OrdersState>(()=>({orders:[],error:'',loading:true,refresh:()=>{}}))
