import { useEffect } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { useOrders } from '../../store/orders'
import { observeCustomerOrders } from '../../services/firestore/orderService'
import { firebaseMessage } from '../../lib/firebase/errors'
export function OrderSync(){const {user}=useAuth(),uid=user?.id;useEffect(()=>{useOrders.setState({orders:[],error:'',loading:!!uid});if(!uid)return;let stop:(()=>void)|undefined;const start=()=>{stop?.();useOrders.setState({loading:true,error:''});stop=observeCustomerOrders(uid,orders=>useOrders.setState({orders,error:'',loading:false}),error=>useOrders.setState({error:firebaseMessage(error),loading:false}))};useOrders.setState({refresh:start});start();return()=>{stop?.();useOrders.setState({orders:[],error:'',loading:false,refresh:()=>{}})}},[uid]);return null}
