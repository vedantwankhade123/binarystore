import type { FakeStoreProduct, Product } from '../types/product'
export const PRODUCT_IMAGE_FALLBACK = '/images/product-placeholder.svg'
const API_BASE = 'https://fakestoreapi.com'
const cache = new Map<string, { expires: number; request: Promise<unknown> }>()
export class ProductServiceError extends Error {
  code: 'network' | 'not-found' | 'invalid-data'
  constructor(message: string, code: 'network' | 'not-found' | 'invalid-data' = 'network') { super(message); this.name = 'ProductServiceError'; this.code = code }
}
async function request(path: string): Promise<unknown> {
  const previous = cache.get(path)
  if (previous && previous.expires > Date.now()) return previous.request
  const pending = (async () => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal })
      if (response.status === 404) throw new ProductServiceError('This product could not be found.', 'not-found')
      if (!response.ok) throw new ProductServiceError('The product service is unavailable. Please try again.')
      const body = await response.text()
      if (!body.trim()) return null
      try { return JSON.parse(body) as unknown } catch { throw new ProductServiceError('The product service returned an unreadable response.', 'invalid-data') }
    } catch (error) {
      cache.delete(path)
      if (error instanceof ProductServiceError) throw error
      throw new ProductServiceError('We couldn’t reach the product service. Check your connection and try again.')
    } finally { window.clearTimeout(timeout) }
  })()
  cache.set(path, { expires: Date.now() + 60000, request: pending })
  return pending
}
function validProduct(value: unknown): value is FakeStoreProduct {
  if (!value || typeof value !== 'object') return false
  const p = value as Partial<FakeStoreProduct>
  return Number.isInteger(p.id) && Number(p.id) > 0 && typeof p.title === 'string' && !!p.title.trim() && typeof p.description === 'string' && typeof p.category === 'string' && typeof p.price === 'number' && Number.isFinite(p.price) && p.price >= 0 && !!p.rating && typeof p.rating.rate === 'number' && Number.isFinite(p.rating.rate) && p.rating.rate >= 0 && p.rating.rate <= 5 && Number.isInteger(p.rating.count) && p.rating.count >= 0
}
export function normalizeProduct(p: FakeStoreProduct): Product {
  return { id: `fakestore:${p.id}`, source: { kind: 'fakestore', externalId: String(p.id) }, name: p.title.trim(), description: p.description, category: p.category, price: p.price, rating: p.rating.rate, reviews: p.rating.count, image: typeof p.image === 'string' && /^https?:\/\//i.test(p.image) ? p.image : PRODUCT_IMAGE_FALLBACK }
}
function normalizeList(data: unknown): Product[] {
  if (data === null) return []
  if (!Array.isArray(data) || !data.every(validProduct)) throw new ProductServiceError('The product service returned invalid product data.', 'invalid-data')
  return data.map(normalizeProduct)
}
async function readValidated<T>(path: string, parse: (data: unknown) => T): Promise<T> {
  try { return parse(await request(path)) } catch (error) { cache.delete(path); throw error }
}
export async function getAllProducts(): Promise<Product[]> { return readValidated('/products', normalizeList) }
export async function getProductById(id: string | number): Promise<Product> {
  const externalId = String(id).replace(/^fakestore:/, '')
  if (!/^[1-9]\d*$/.test(externalId) || !Number.isSafeInteger(Number(externalId))) throw new ProductServiceError('This product link is invalid.', 'not-found')
  return readValidated(`/products/${externalId}`, data => {
    if (data === null) throw new ProductServiceError('This product could not be found.', 'not-found')
    if (!validProduct(data) || data.id !== Number(externalId)) throw new ProductServiceError('The product service returned invalid product data.', 'invalid-data')
    return normalizeProduct(data)
  })
}
export async function getCategories(): Promise<string[]> {
  return readValidated('/products/categories', data => {
    if (data === null) return []
    if (!Array.isArray(data) || !data.every(c => typeof c === 'string' && c.trim())) throw new ProductServiceError('The product service returned invalid categories.', 'invalid-data')
    return [...new Set(data as string[])]
  })
}
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!category.trim()) return []
  return readValidated(`/products/category/${encodeURIComponent(category)}`, normalizeList)
}
