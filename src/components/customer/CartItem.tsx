import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import type { CartLine } from '../../types/customer'
import { QuantitySelector } from './QuantitySelector'
import { ProductImage } from '../products/ProductImage'
import { useShop } from '../../hooks/useShop'
import { money } from '../../utils/commerce'
import { categoryLabel } from '../../features/products/data'
export function CartItem({line}:{line:CartLine}){const {setQuantity,removeFromCart}=useShop();const {product:p,quantity}=line;return <article className="cart-item"><Link className="cart-item-image" to={`/products/${p.id}`}><ProductImage src={p.image} alt={p.name}/></Link><div className="cart-item-info"><span className="product-category">{categoryLabel(p.category)}</span><Link to={`/products/${p.id}`} className="cart-item-name">{p.name}</Link><span className="unit-price">{money(p.price)} each</span><QuantitySelector label={`Quantity for ${p.name}`} value={quantity} onChange={q=>setQuantity(p.id,q)}/></div><div className="cart-item-end"><strong>{money(p.price*quantity)}</strong><button className="remove-button" aria-label={`Remove ${p.name} from cart`} onClick={()=>removeFromCart(p.id)}><Trash2 size={16}/><span>Remove</span></button></div></article>}
