import type { LucideIcon } from 'lucide-react'
import { PackageOpen, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
export function EmptyState({title,description,to='/',actionLabel='Explore BinaryStore',icon:Icon=PackageOpen}:{title:string;description:string;to?:string;actionLabel?:string;icon?:LucideIcon}){return <div className="empty-state"><Icon size={48} strokeWidth={1.3}/><h1>{title}</h1><p>{description}</p><Link className="button" to={to}>{actionLabel}</Link></div>}
export function LoadingSkeleton(){return <div className="skeleton customer-skeleton" role="status" aria-label="Loading content"><div/><span/><span/></div>}
export function ProductSkeleton(){return <div className="skeleton" aria-hidden="true"><div/><span/><span/></div>}
export function ProductSkeletonGrid({count=4}:{count?:number}){return <div role="status" aria-label="Loading products"><span className="sr-only">Loading products…</span><div className="product-grid">{Array.from({length:count},(_,i)=><ProductSkeleton key={i}/>)}</div></div>}
export function RequestError({message,retry}:{message:string;retry:()=>void}){return <div className="request-error" role="alert"><AlertCircle size={24}/><div><h3>We couldn’t load this collection</h3><p>{message}</p></div><button className="button" onClick={retry}>Try again</button></div>}
