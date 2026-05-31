import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">iF</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent hidden sm:block">
              iFood Clone
            </span>
          </Link>

          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium hidden md:block">São Paulo, SP</span>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar restaurantes ou pratos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-red-500 font-medium transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                >
                  Cadastrar
                </Link>
              </>
            ) : (
              <>
                <Link to="/cart" className="relative p-2 text-gray-700 hover:text-red-500 transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </button>

                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                          <p className="text-xs text-gray-500">{profile?.email}</p>
                        </div>

                        {profile?.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Painel Admin
                          </Link>
                        )}
                        {profile?.role === 'restaurant_owner' && (
                          <Link to="/restaurant-dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Meu Restaurante
                          </Link>
                        )}
                        {profile?.role === 'delivery_partner' && (
                          <Link to="/delivery-dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Entregas
                          </Link>
                        )}

                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Meus Pedidos
                        </Link>
                        <Link to="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Favoritos
                        </Link>
                        <Link to="/addresses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Endereços
                        </Link>
                        {profile?.role === 'customer' && (
                          <Link to="/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Carteira
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            signOut();
                            setShowMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium"
                        >
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar restaurantes ou pratos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </form>
      </div>
    </header>
  );
}
