import { ShoppingStatus } from '../components/common/ShoppingSync'
import { AuthStatus } from '../components/common/AuthStatus'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
export function AuthLayout() {
  return <main className="auth-layout"><div className="auth-visual"><Link className="auth-back" to="/shop"><ArrowLeft size={17}/> Back to shopping</Link><img src="/images/fashion.jpg" alt="A shopper carrying bags and enjoying a day out"/></div><div className="auth-content"><AuthStatus/><ShoppingStatus/><Suspense fallback={<div className="auth-route-loading" role="status">Loading your form…</div>}><Outlet/></Suspense></div></main>
}
