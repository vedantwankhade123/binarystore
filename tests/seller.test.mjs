import test from 'node:test'
import assert from 'node:assert/strict'
import { initialProducts,initialOrders,initialSettings } from './fixtures/sellerData.ts'
import { validateListing,validateStoreSettings,sellerMetrics,sellerRevenueHistory } from '../src/features/seller/logic.ts'
const base={title:'Listing',description:'Description',category:'Accessories',price:50,discountPrice:40,sku:'UNIQUE',stock:5,images:[{id:'img',url:'https://example.test/img.jpg',name:'Image'}],status:'Active',specifications:[]}
test('seller input validation rejects invalid pricing, stock, SKU, images and settings',()=>{assert.equal(validateListing(base,initialProducts),'');assert.match(validateListing({...base,price:0},initialProducts),/Price/);assert.match(validateListing({...base,discountPrice:55},initialProducts),/Discount/);assert.match(validateListing({...base,stock:-1},initialProducts),/Stock/);assert.match(validateListing({...base,sku:initialProducts[0].sku},initialProducts),/SKU/);assert.match(validateListing({...base,images:[]},initialProducts),/image/);assert.match(validateStoreSettings({...initialSettings,email:'invalid'}),/email/)})
test('seller fixture aggregates retain consistent totals',()=>{const metrics=sellerMetrics(initialProducts,initialOrders);assert.equal(metrics.orders,12);assert.equal(metrics.sales,24);assert.equal(metrics.lowStock.length,3)})

test('seller analytics use delivered orders and produce zero history for an empty store',()=>{
 const history=sellerRevenueHistory([],6,new Date('2026-10-28T00:00:00Z'));assert.equal(history.length,6);assert(history.every(month=>month.revenue===0&&month.orders===0))
 const order={...initialOrders[0],date:'2026-10-15T00:00:00Z',status:'Delivered',items:[{...initialOrders[0].items[0],price:25,quantity:2}]}
 const actual=sellerRevenueHistory([order,{...order,id:'pending',status:'Placed'}],6,new Date('2026-10-28T00:00:00Z')).at(-1)
 assert.equal(actual.revenue,50);assert.equal(actual.orders,2);assert.equal(actual.deliveredOrders,1)
 assert.equal(sellerMetrics([],[]).revenue,0);assert.equal(sellerMetrics([],[order,{...order,status:'Placed'}]).revenue,50)
})
