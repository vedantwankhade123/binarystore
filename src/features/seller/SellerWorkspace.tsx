import { SellerSync } from '../../components/seller/SellerSync'
import { Routes, Route } from 'react-router-dom'
import { SellerLayout } from '../../layouts/SellerLayout'
import { SellerOverviewPage, SellerAnalyticsPage } from '../../pages/seller/DashboardPages'
import { SellerProductsPage, SellerProductFormPage } from '../../pages/seller/ProductPages'
import { SellerOrdersPage, SellerOrderDetailsPage } from '../../pages/seller/OrderPages'
import { SellerSettingsPage } from '../../pages/seller/SettingsPage'
import { EmptyState } from '../../components/ui/States'
// Seller routes use Firebase Authentication, trusted seller claims, and private Firestore records.
export default function SellerWorkspace(){return <SellerSync><Routes><Route  element={<SellerLayout/>}><Route index element={<SellerOverviewPage/>}/><Route path="products" element={<SellerProductsPage/>}/><Route path="products/new" element={<SellerProductFormPage/>}/><Route path="products/:id/edit" element={<SellerProductFormPage/>}/><Route path="orders" element={<SellerOrdersPage/>}/><Route path="orders/:id" element={<SellerOrderDetailsPage/>}/><Route path="analytics" element={<SellerAnalyticsPage/>}/><Route path="settings" element={<SellerSettingsPage/>}/><Route path="*" element={<section className="seller-panel"><EmptyState title="Seller page not found" description="Return to your dashboard to keep managing your store." to="/seller" actionLabel="Back to dashboard"/></section>}/></Route></Routes></SellerSync>}
