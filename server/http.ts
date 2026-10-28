import { ApiError } from './errors.ts'
import { getAdminServices } from './firebaseAdmin.ts'
import { createOrder, updateFulfillment, enrollSeller } from './operations.ts'

import {signUpload,finalizeUpload,deleteUpload} from './media.ts'
import {saveProduct,archiveProduct,saveStoreSettings} from './products.ts'
const operations = { createOrder, updateFulfillment, enrollSeller,signUpload,finalizeUpload,deleteUpload,saveProduct,archiveProduct,saveStoreSettings }
const statuses = { unauthenticated: 401, 'permission-denied': 403, 'invalid-argument': 400, 'not-found': 404, 'failed-precondition': 409, unavailable: 503, internal: 500 }
const maxBodyBytes = 64 * 1024
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

async function readPayload(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError('invalid-argument', 'Send a JSON request.')
  if (Number(request.headers.get('content-length') || 0) > maxBodyBytes) throw new ApiError('invalid-argument', 'The request is too large.')
  const reader = request.body?.getReader()
  if (!reader) throw new ApiError('invalid-argument', 'A JSON object is required.')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      length += chunk.value.byteLength
      if (length > maxBodyBytes) { await reader.cancel(); throw new ApiError('invalid-argument', 'The request is too large.') }
      chunks.push(chunk.value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  try {
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('object required')
    return data as Record<string, unknown>
  } catch { throw new ApiError('invalid-argument', 'A valid JSON object is required.') }
}

export async function handleRequest(request: Request): Promise<Response> {
  try {
    const path = new URL(request.url).pathname
    const match = /^(?:\/api|\/\.netlify\/functions\/shop-api)\/([a-zA-Z]+)$/.exec(path)
    if (!match || !Object.hasOwn(operations, match[1])) throw new ApiError('not-found', 'This operation does not exist.')
    if (request.method !== 'POST') return json({ error: { code: 'invalid-argument', message: 'Use POST for this operation.' } }, 405)
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) throw new ApiError('permission-denied', 'Use this website to submit the request.')
    const bearer = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') || '')
    if (!bearer) throw new ApiError('unauthenticated', 'Sign in to continue.')
    const data = await readPayload(request)
    const { auth } = getAdminServices()
    let token
    try { token = await auth.verifyIdToken(bearer[1], true) }
    catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
      if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/user-disabled', 'auth/user-not-found'].includes(code)) {
        throw new ApiError('unauthenticated', 'Your session has expired. Sign in again.')
      }
      throw error
    }
    const result = await operations[match[1] as keyof typeof operations]({ auth: { uid: token.uid, token }, data })
    return json({ data: result })
  } catch (error) {
    if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message } }, statuses[error.code])
    // Never return SDK errors, credentials, or customer data to the browser/logs.
    console.error('BinaryStore server operation failed', error && typeof error === 'object' && 'code' in error ? String(error.code) : 'internal')
    return json({ error: { code: 'unavailable', message: 'The service is temporarily unavailable. Please try again.' } }, 503)
  }
}
