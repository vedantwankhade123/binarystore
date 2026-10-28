import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateTotals, clampQuantity } from '../src/utils/commerce.ts'
import { createOrder as createDemoOrder, readOrders, saveOrder as saveDemoOrder, updateOrderStatus as updateDemoOrderStatus } from './fixtures/legacyOrderService.ts'
const product={id:'fakestore:1',source:{kind:'fakestore',externalId:'1'},name:'Demo shirt',description:'Soft cotton',category:"men's clothing",price:19.99,rating:4,reviews:10,image:'/images/shirt.jpg'}
const address={id:'address-1',fullName:'Demo Shopper',phone:'2025550123',address:'123 Demo Lane',city:'Sample City',state:'California',postalCode:'90210',country:'United States'}
test('money uses cent arithmetic and the free-shipping threshold',()=>{
 assert.deepEqual(calculateTotals([{product,quantity:3}]),{subtotal:59.97,shipping:5.95,total:65.92,count:3})
 assert.equal(calculateTotals([{product:{...product,price:75},quantity:1}]).shipping,0)
 assert.equal(calculateTotals([{product:{...product,price:74.99},quantity:1}]).shipping,5.95)
 assert.deepEqual(calculateTotals([]),{subtotal:0,shipping:0,total:0,count:0})
 assert.equal(clampQuantity(-1),1);assert.equal(clampQuantity(0),1);assert.equal(clampQuantity(150),99);assert.equal(clampQuantity(2.8),2)
})
test('demo orders keep immutable snapshots and reject empty bags',()=>{
 const items=[{product:{...product},quantity:2}]
 const order=createDemoOrder(items,address,'simulated-card')
 assert(order.id.startsWith('DEMO-'));assert.equal(order.status,'Placed');assert.equal(order.total,45.93);assert.equal(order.demo,true)
 items[0].quantity=5;items[0].product.name='Changed'
 assert.equal(order.items[0].quantity,2);assert.equal(order.items[0].product.name,'Demo shirt')
 assert.throws(()=>createDemoOrder([],address,'cod'),/empty/)
})
test('orders persist, deduplicate, update tracking and surface failed writes',()=>{
 const memory=new Map();const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)}})
 try{
  const order=createDemoOrder([{product,quantity:1}],address,'cod')
  saveDemoOrder(order);saveDemoOrder(order);assert.equal(readOrders().length,1)
  updateDemoOrderStatus(order.id,'Delivered');assert.equal(readOrders()[0].status,'Delivered')
  updateDemoOrderStatus(order.id,'Cancelled');assert.equal(readOrders()[0].status,'Cancelled')
  localStorage.setItem=()=>{throw new Error('Quota exceeded')}
  assert.throws(()=>saveDemoOrder(createDemoOrder([{product,quantity:1}],address,'cod')),/Quota exceeded/)
  assert.equal(readOrders().length,1)
 }finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else delete globalThis.localStorage}
})
