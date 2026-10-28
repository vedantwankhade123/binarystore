export type ErrorCode = 'unauthenticated' | 'permission-denied' | 'invalid-argument' | 'not-found' | 'failed-precondition' | 'unavailable' | 'internal'

export class ApiError extends Error {
  readonly code: ErrorCode
  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
