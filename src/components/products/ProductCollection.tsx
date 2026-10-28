import type { Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import { ProductSkeletonGrid, RequestError } from '../ui/States'
export function ProductCollection({products,loading,error,retry}:{products:Product[];loading:boolean;error:Error|null;retry:()=>void}) {
  if (loading) return <ProductSkeletonGrid/>
  if (error) return <RequestError message={error.message} retry={retry}/>
  if (!products.length) return <p className="inline-empty" role="status">There are no products in this collection yet.</p>
  return <div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>
}
