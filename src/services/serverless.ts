import { auth } from '../lib/firebase/client'

type Operation = 'createOrder' | 'updateFulfillment' | 'enrollSeller' | 'signUpload' | 'finalizeUpload' | 'deleteUpload' | 'saveProduct' | 'archiveProduct' | 'saveStoreSettings'
export class ServerlessError extends Error {
  readonly code: string
  constructor(code: string, message: string) { super(message); this.code = `api/${code}` }
}

export async function callServerless<T>(operation: Operation, data: object): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new ServerlessError('unauthenticated', 'Sign in to continue.')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)
  try {
    const token = await user.getIdToken()
    const response = await fetch(`/api/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data), signal: controller.signal,
    })
    const payload = await response.json().catch(() => null) as { data?: T; error?: { code?: string; message?: string } } | null
    if (!response.ok || !payload || !('data' in payload)) {
      throw new ServerlessError(payload?.error?.code || 'unavailable', payload?.error?.message || 'The store service is temporarily unavailable. Please try again.')
    }
    return payload.data as T
  } catch (error) {
    if (error instanceof ServerlessError) throw error
    throw new ServerlessError('unavailable', 'Could not reach the service. Check your connection and try again.')
  } finally { clearTimeout(timer) }
}
