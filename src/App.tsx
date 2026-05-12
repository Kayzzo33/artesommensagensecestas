/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PublicLayout } from './components/public/PublicLayout';

// Public Pages
import Home from './pages/public/Home';
// import CategoryPage from './pages/public/CategoryPage';
import ProductPage from './pages/public/ProductPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
// import CustomBasketPage from './pages/public/CustomBasketPage';
import CustomBasket from './pages/public/CustomBasket';

import CategoryPage from './pages/public/CategoryPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBanners from './pages/admin/AdminBanners';
import AdminOrders from './pages/admin/AdminOrders';
import AdminNeighborhoods from './pages/admin/AdminNeighborhoods';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStock from './pages/admin/AdminStock';
import AdminFinancial from './pages/admin/AdminFinancial';
import { AdminLayout } from './components/admin/AdminLayout';

const DummyLayout = ({ admin = false }: { admin?: boolean }) => (
  <div className={`min-h-screen ${admin ? 'bg-zinc-950 text-white' : 'bg-[#FFF9F0]'}`}>
    <Outlet />
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cesta-personalizada" element={<CustomBasket />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/produtos" element={<AdminProducts />} />
          <Route path="/admin/categorias" element={<AdminCategories />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/pedidos" element={<AdminOrders />} />
          <Route path="/admin/bairros" element={<AdminNeighborhoods />} />
          <Route path="/admin/estoque" element={<AdminStock />} />
          <Route path="/admin/financeiro" element={<AdminFinancial />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}
