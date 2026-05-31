import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/layout/Header';

import { HomePage } from './pages/HomePage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { CartPage } from './pages/CartPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { AddressesPage } from './pages/AddressPages';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminWithdrawals } from './pages/admin/AdminWithdrawals';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { WalletPage } from './pages/WalletPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/*"
              element={
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/restaurants" element={<RestaurantsPage />} />
                      <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/orders/:id" element={<OrderDetailPage />} />
                      <Route path="/addresses" element={<AddressesPage />} />
                      <Route path="/wallet" element={<WalletPage />} />
                      <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
                    </Routes>
                  </main>
                </div>
              }
            />

            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/withdrawals" element={<AdminWithdrawals />} />
    </Routes>
  );
}

export default App;
