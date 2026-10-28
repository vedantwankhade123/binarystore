import type { Product } from '../../types/product'

export function ProductSourceBadge({product}:{product:Product}){
 const fake=product.source.kind==='fakestore'
 return <span className={`product-source-badge ${fake?'source-fake':'source-real'}`} title={fake?'Sample product from Fake Store API':'Published by a BinaryStore seller'}>{fake?'Fake':'Real'}</span>
}
