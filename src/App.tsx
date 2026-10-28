import { SellerStartPage } from './pages/auth/SellerStartPage'
import { ShoppingSync, ShoppingStatus } from './components/common/ShoppingSync'
import { OrderSync } from './components/common/OrderSync'
import { AuthStatus } from './components/common/AuthStatus'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { Header, Footer } from './components/layout/HeaderFooter'
import { EmptyState, LoadingSkeleton } from './components/ui/States'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { CartPage, WishlistPage } from './pages/ShoppingPages'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrdersPage, OrderDetailsPage } from './pages/OrdersPages'
import { ProfilePage } from './pages/ProfilePages'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { AuthLayout } from './layouts/AuthLayout'
import { AuthProvider } from './features/auth/AuthProvider'
import { PublicRoute, ProtectedRoute, SellerProtectedRoute } from './routes/AuthRoutes'
import { useFeedback } from './store/feedback'
const LoginPage=lazy(()=>import('./pages/auth/LoginPage').then(module=>({default:module.LoginPage})))
const RegisterPage=lazy(()=>import('./pages/auth/RegisterPage').then(module=>({default:module.RegisterPage})))
const ForgotPasswordPage=lazy(()=>import('./pages/auth/ForgotPasswordPage').then(module=>({default:module.ForgotPasswordPage})))
const SellerWorkspace=lazy(()=>import('./features/seller/SellerWorkspace'))
function StorefrontLayout(){const {notice,storageWarning}=useFeedback();return <><Header/><AuthStatus/><ShoppingStatus/>{storageWarning&&<div className="storage-warning" role="alert">Browser storage is unavailable or full. Shopping changes may not survive a refresh; some changes may not persist until storage is available.</div>}<Outlet/><Footer/>{notice&&<div role="status" className="toast">✓ {notice}</div>}</>}
function AppRoutes(){
 const {pathname}=useLocation()
 useEffect(()=>{window.scrollTo(0,0)},[pathname])
 return <Routes>
  <Route element={<SellerProtectedRoute/>}><Route path="/seller/*" element={<Suspense fallback={<main className="container customer-page"><LoadingSkeleton/></main>}><SellerWorkspace/></Suspense>}/></Route>
  <Route element={<AuthLayout/>}>
   <Route path="/seller/start" element={<SellerStartPage/>}/><Route element={<PublicRoute/>}><Route path="/seller/login" element={<LoginPage/>}/><Route path="/seller/register" element={<RegisterPage/>}/><Route path="/seller/forgot-password" element={<ForgotPasswordPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/></Route>
   <Route element={<ProtectedRoute/>}><Route path="/auth/complete-profile" element={<Navigate to="/profile#settings" replace/>}/><Route path="/auth/verify-email" element={<VerifyEmailPage/>}/></Route>
  </Route>
  <Route element={<StorefrontLayout/>}>
   <Route path="/" element={<HomePage/>}/><Route path="/shop" element={<ShopPage/>}/><Route path="/products" element={<ShopPage/>}/><Route path="/products/:id" element={<ProductDetailsPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/wishlist" element={<WishlistPage/>}/>
   <Route element={<ProtectedRoute requireVerified/>}><Route path="/checkout" element={<CheckoutPage/>}/></Route><Route element={<ProtectedRoute/>}><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:id" element={<OrderDetailsPage/>}/><Route path="/orders/:id/confirmation" element={<OrderDetailsPage confirmation/>}/><Route path="/profile" element={<ProfilePage/>}/></Route>
   <Route path="/access-denied" element={<AccessDeniedPage/>}/>
   <Route path="*" element={<main className="container customer-page"><EmptyState title="Page not found" description="Let’s get you back to your next good find." to="/shop" actionLabel="Browse products"/></main>}/>
  </Route>
 </Routes>
}
export default function App(){return <BrowserRouter><AuthProvider><ShoppingSync/><OrderSync/><AppRoutes/></AuthProvider></BrowserRouter>}
