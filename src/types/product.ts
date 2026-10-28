export interface FakeStoreProduct {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating: { rate: number; count: number }
}
export type ProductSource = { kind: 'fakestore'; externalId: string } | { kind: 'firestore'; listingId: string; sellerId: string }
/** Namespaced IDs keep imported sample products separate from future seller listings. */
export interface Product {
  id: string
  source: ProductSource
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  stock?: number
  badge?: string
}
