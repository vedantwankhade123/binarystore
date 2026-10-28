import { useAuth } from '../features/auth/useAuth'
import { useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { SellerSidebar } from '../components/seller/SellerSidebar'
import { SellerNavbar } from '../components/seller/SellerNavbar'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'
/** SellerProtectedRoute and Firestore rules enforce seller ownership. */
export function SellerLayout(){const [collapsed,setCollapsed]=useState(false),[logout,setLogout]=useState(false),drawer=useRef<HTMLDialogElement>(null),navigate=useNavigate(),{signOut}=useAuth();return <div className={`seller-layout ${collapsed?'sidebar-small':''}`}><div className="seller-desktop-sidebar"><SellerSidebar collapsed={collapsed} onCollapse={()=>setCollapsed(v=>!v)}/></div><div className="seller-main"><SellerNavbar onMenu={()=>drawer.current?.showModal()} onLogout={()=>setLogout(true)}/><main className="seller-content"><Outlet/></main></div><dialog className="seller-drawer" ref={drawer} aria-label="Seller navigation" onClick={e=>{if(e.target===e.currentTarget&&e.clientX>e.currentTarget.getBoundingClientRect().right)drawer.current?.close()}}><SellerSidebar drawer onNavigate={()=>drawer.current?.close()}/></dialog><ConfirmationDialog open={logout} title="Log out of your seller account?" description="Your store data is saved. You can sign in again to continue." confirmLabel="Log out" onClose={()=>setLogout(false)} onConfirm={async()=>{if(await signOut())navigate('/seller/login',{replace:true})}}/></div>}
