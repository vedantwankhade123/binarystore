import { Link } from 'react-router-dom'
import { Heart, Plus, Star } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { ProductSourceBadge } from './ProductSourceBadge'
import { categoryLabel } from '../../features/products/data'
import type { Product } from '../../types/product'
import { useShop } from '../../hooks/useShop'
export function ProductCard({product:p}:{product:Product}){
 const {wishlist,toggleWishlist,addToCart,syncing,pendingWrites}=useShop()
 return <article className="product-card"><div className="product-photo"><Link to={`/products/${p.id}`}><ProductImage src={p.image} alt={p.name} loading="lazy"/></Link><div className="product-badges"><ProductSourceBadge product={p}/>{p.badge&&<span className="badge">{p.badge}</span>}</div><button className={`wish ${wishlist.some(item=>item.id===p.id)?'selected':''}`} aria-label={`${wishlist.some(item=>item.id===p.id)?'Remove':'Save'} ${p.name}`} disabled={syncing||pendingWrites>0} aria-pressed={wishlist.some(item=>item.id===p.id)} onClick={()=>toggleWishlist(p)}><Heart size={17}/></button></div><div className="product-info"><span className="product-category">{categoryLabel(p.category)}</span><Link to={`/products/${p.id}`} className="product-name">{p.name}</Link><div className="rating"><Star size={12} fill="currentColor"/><strong>{p.rating}</strong><span>({p.reviews} reviews)</span></div><div className="price-row"><div><strong>${p.price.toFixed(2)}</strong>{p.originalPrice !== undefined && p.originalPrice > p.price && <del>${p.originalPrice.toFixed(2)}</del>}</div><button className="add" disabled={syncing||pendingWrites>0||p.source.kind==='fakestore'||p.stock===0} title={p.source.kind==='fakestore'?'Fake Store samples cannot be ordered':p.stock===0?'Out of stock':undefined} aria-label={`Add ${p.name} to cart`} onClick={()=>addToCart(p)}><Plus size={18}/></button></div></div></article>
}

