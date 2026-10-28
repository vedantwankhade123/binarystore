import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Star, ArrowLeft, ShoppingBag } from 'lucide-react'
import { getProductById, getProductsByCategory, ProductServiceError } from '../services/catalogService'
import { useResource } from '../hooks/useResource'
import { QuantitySelector } from '../components/customer/QuantitySelector'
import { useShop } from '../hooks/useShop'
import { ProductSourceBadge } from '../components/products/ProductSourceBadge'
import { ProductImage } from '../components/products/ProductImage'
import { ProductCollection } from '../components/products/ProductCollection'
import { RequestError } from '../components/ui/States'
import { categoryLabel } from '../features/products/data'
import type { Product } from '../types/product'
function RelatedProducts({product}:{product:Product}){
  const loader=useCallback(()=>getProductsByCategory(product.category),[product.category])
  const related=useResource(loader)
  return <section className="related-products"><div className="section-heading"><h2>You might also like</h2><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>Shop this category</Link></div><ProductCollection products={(related.data||[]).filter(p=>p.id!==product.id).slice(0,4)} loading={related.loading} error={related.error} retry={related.retry}/></section>
}
export function ProductDetailsPage(){
  const {id=''}=useParams()
  // Remount the quantity and request state when navigating between products.
  return <ProductDetails key={id} id={id}/>
}
function ProductDetails({id}:{id:string}){
  const loader=useCallback(()=>getProductById(id),[id])
  const resource=useResource(loader)
  const {addToCart,toggleWishlist,wishlist}=useShop()
  const [quantity,setQuantity]=useState(1)
  if(resource.loading) return <main className="container details-page"><div role="status" aria-label="Loading product details" className="details-skeleton"><span className="sr-only">Loading product details…</span><div className="skeleton"><div/></div><div className="skeleton"><span/><span/><span/></div></div></main>
  if(resource.error) return <main className="container details-page"><Link className="back-link" to="/shop"><ArrowLeft size={16}/> Back to shop</Link>{resource.error instanceof ProductServiceError&&resource.error.code==='not-found'?<div className="empty-results"><ShoppingBag size={36}/><h1>Product not found</h1><p>{resource.error.message}</p><Link className="button" to="/shop">Browse products</Link></div>:<RequestError message={resource.error.message} retry={resource.retry}/>}</main>
  if(!resource.data) return null
  const product=resource.data, saved=wishlist.some(item=>item.id===product.id)
  return <main className="container details-page"><Link className="back-link" to="/shop"><ArrowLeft size={16}/> Back to shop</Link><div className="product-details"><div className="detail-image"><ProductImage src={product.image} alt={product.name}/></div><div className="detail-copy"><ProductSourceBadge product={product}/><Link className="product-category" to={`/shop?category=${encodeURIComponent(product.category)}`}>{categoryLabel(product.category)}</Link><h1>{product.name}</h1><div className="detail-rating"><Star size={17} fill="currentColor"/><strong>{product.rating.toFixed(1)}</strong><span>{product.reviews} reviews</span></div><div className="detail-price">${product.price.toFixed(2)}</div><p className="detail-description">{product.description}</p><div className="quantity-field"><span id="quantity-label">Quantity</span><QuantitySelector value={quantity} onChange={setQuantity}/></div><div className="detail-actions"><button className="button" disabled={product.source.kind==='fakestore'||product.stock===0||quantity>(product.stock??99)} onClick={()=>addToCart(product,quantity)}><ShoppingBag size={18}/> {product.source.kind==='fakestore'?'Sample product · Not for sale':product.stock===0?'Out of stock':`Add to cart · $${(product.price*quantity).toFixed(2)}`}</button><button className={`detail-wishlist ${saved?'selected':''}`} aria-pressed={saved} onClick={()=>toggleWishlist(product)}><Heart size={18} fill={saved?'currentColor':'none'}/>{saved?'Saved':'Save to wishlist'}</button></div></div></div><RelatedProducts product={product}/></main>
}
