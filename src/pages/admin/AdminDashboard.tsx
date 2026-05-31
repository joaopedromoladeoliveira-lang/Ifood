import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  DollarSign,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Navigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: string;
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className={`w-4 h-4 mr-1 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-gray-500 ml-1">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
}

function MenuItem({ icon, label, path, active }: MenuItemProps) {
  return (
    <Link
      to={path}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    activeOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentData();
  }, []);

  const loadStats = async () => {
    const [usersCount, restaurantsCount, ordersCount, ordersSum, withdrawalsCount, activeOrdersCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('restaurants').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering']),
    ]);

    const totalRevenue = ordersSum.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    setStats({
      totalUsers: usersCount.count || 0,
      totalRestaurants: restaurantsCount.count || 0,
      totalOrders: ordersCount.count || 0,
      totalRevenue,
      pendingWithdrawals: withdrawalsCount.count || 0,
      activeOrders: activeOrdersCount.count || 0,
    });

    setLoading(false);
  };

  const loadRecentData = async () => {
    const [ordersRes, withdrawalsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, profiles!orders_customer_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('withdrawals')
        .select('*, profiles!withdrawals_user_id_fkey(full_name, role)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (ordersRes.data) setRecentOrders(ordersRes.data);
    if (withdrawalsRes.data) setRecentWithdrawals(withdrawalsRes.data);
  };

  if (profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-sm text-gray-500">iFood Clone</p>
        </div>

        <nav className="space-y-1">
          <MenuItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            path="/admin"
            active={activeMenu === 'dashboard'}
          />
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Usuários"
            path="/admin/users"
            active={activeMenu === 'users'}
          />
          <MenuItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Saques"
            path="/admin/withdrawals"
            active={activeMenu === 'withdrawals'}
          />
          <MenuItem
            icon={<Store className="w-5 h-5" />}
            label="Restaurantes"
            path="/admin/restaurants"
            active={activeMenu === 'restaurants'}
          />
          <MenuItem
            icon={<Package className="w-5 h-5" />}
            label="Pedidos"
            path="/admin/orders"
            active={activeMenu === 'orders'}
          />
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Configurações"
            path="/admin/settings"
            active={activeMenu === 'settings'}
          />
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Visão geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={<Users className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Restaurantes"
            value={stats.totalRestaurants}
            icon={<Store className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Pedidos Ativos"
            value={stats.activeOrders}
            icon={<Package className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            title="Total de Pedidos"
            value={stats.totalOrders}
            icon={<Package className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
          <StatCard
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            title="Saques Pendentes"
            value={stats.pendingWithdrawals}
            icon={<Clock className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Pedidos Recentes</h3>
            </CardHeader>
            <CardBody>
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum pedido</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.profiles?.full_name || 'Cliente'}
                        </p>
                        <p className="text-sm text-gray-500">
                          R$ {order.total.toFixed(2)} - {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={
                        order.status === 'delivered' ? 'success' :
                        order.status === 'cancelled' ? 'danger' : 'info'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Saques Pendentes</h3>
                {stats.pendingWithdrawals > 0 && (
                  <Badge variant="warning">{stats.pendingWithdrawals} pendentes</Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {recentWithdrawals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum saque pendente</p>
              ) : (
                <div className="space-y-3">
                  {recentWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{withdrawal.profiles?.full_name}</p>
                        <p className="text-sm text-gray-500">
                          R$ {withdrawal.net_amount.toFixed(2)} - {withdrawal.profiles?.role === 'restaurant_owner' ? 'Restaurante' : 'Entregador'}
                        </p>
                      </div>
                      <Link
                        to="/admin/withdrawals"
                        className="text-red-500 hover:text-red-600 text-sm font-medium"
                      >
                        Revisar
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
