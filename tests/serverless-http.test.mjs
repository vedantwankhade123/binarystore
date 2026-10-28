import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../netlify/functions/shop-api.ts'

const request = (path, options = {}) => new Request(`https://shop.example${path}`, options)
test('serverless routes reject unknown operations and unsupported methods', async () => {
  for (const path of ['/api/constructor', '/api/noSuchOperation', '/api/enrollSeller/extra']) assert.equal((await handler(request(path))).status, 404)
  assert.equal((await handler(request('/api/enrollSeller'))).status, 405)
})
test('serverless mutations reject anonymous calls and cross-origin requests', async () => {
  const anonymous = await handler(request('/api/enrollSeller', { method: 'POST' }))
  assert.equal(anonymous.status, 401)
  assert.equal(anonymous.headers.get('cache-control'), 'no-store')
  const foreign = await handler(request('/api/enrollSeller', { method: 'POST', headers: { origin: 'https://evil.example' } }))
  assert.equal(foreign.status, 403)
})
test('JSON parsing rejects malformed, non-object, and oversized request bodies', async () => {
  for (const body of ['{broken', 'null', '[]', JSON.stringify({ value: 'x'.repeat(66000) })]) {
    const result = await handler(request('/api/enrollSeller', { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' }, body }))
    assert.equal(result.status, 400)
  }
  const result = await handler(request('/api/enrollSeller', { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'text/plain' }, body: '{}' }))
  assert.equal(result.status, 400)
})
