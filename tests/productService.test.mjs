import test from 'node:test'
import assert from 'node:assert/strict'
globalThis.window = globalThis
const sample = {id:1,title:'Cotton shirt',price:12.5,description:'A soft essential',category:"men's clothing",image:'https://example.com/shirt.png',rating:{rate:4.5,count:15}}
let instance = 0
const service = () => import(`../src/services/productService.ts?test=${instance++}`)
const respond = (data,status=200) => new Response(data === undefined ? '' : JSON.stringify(data), {status})
test('normalizes data, namespaces IDs, caches requests and encodes categories',async()=>{
 const original = globalThis.fetch
 const calls=[]
 globalThis.fetch=async url=>{calls.push(url);return respond(url.endsWith('/categories')?["men's clothing"]:url.endsWith('/1')?sample:[sample])}
 try {
  const api=await service();const all=await api.getAllProducts()
  assert.equal(all[0].id,'fakestore:1');assert.equal(all[0].description,sample.description);assert.equal(all[0].source.kind,'fakestore');assert.equal(all[0].originalPrice,undefined)
  await api.getAllProducts();assert.equal(calls.length,1)
  assert.equal((await api.getProductById('fakestore:1')).name,sample.title)
  assert.deepEqual(await api.getCategories(),["men's clothing"])
  await api.getProductsByCategory("men's clothing");assert(calls.at(-1).endsWith("/products/category/men's%20clothing"))
 }finally{globalThis.fetch=original}
})
test('invalid IDs never request the API; empty detail responses are not found',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return respond(undefined)}
 try{const api=await service();for(const id of ['0','-1','abc','firestore:1','1.5','1/2'])await assert.rejects(()=>api.getProductById(id),e=>e.code==='not-found');assert.equal(calls,0);await assert.rejects(()=>api.getProductById(999),e=>e.code==='not-found');assert.equal(calls,1)}finally{globalThis.fetch=original}
})
test('network and invalid-data errors can be retried successfully',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;if(calls===1)throw new TypeError('Network down');if(calls===2)return respond([{id:1}]);return respond([sample])}
 try{const api=await service();await assert.rejects(()=>api.getAllProducts(),e=>e.code==='network');await assert.rejects(()=>api.getAllProducts(),e=>e.code==='invalid-data');assert.equal((await api.getAllProducts()).length,1);assert.equal(calls,3)}finally{globalThis.fetch=original}
})
test('empty lists, missing images and HTTP failures are handled',async()=>{
 const original=globalThis.fetch
 try{const api=await service();globalThis.fetch=async()=>respond([]);assert.deepEqual(await api.getAllProducts(),[]);globalThis.fetch=async()=>respond([{...sample,image:undefined}]);assert.equal((await api.getProductsByCategory('missing-image'))[0].image,api.PRODUCT_IMAGE_FALLBACK);globalThis.fetch=async()=>respond({},503);await assert.rejects(()=>api.getProductsByCategory('unavailable'),e=>e.code==='network');globalThis.fetch=async()=>respond({},404);await assert.rejects(()=>api.getProductById(101),e=>e.code==='not-found')}finally{globalThis.fetch=original}
})
