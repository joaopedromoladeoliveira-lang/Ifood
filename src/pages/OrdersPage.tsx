import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Package, ChefHat, Truck, CheckCircle, XCircle as XCircleIcon } from 'lucide-react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge, getStatusColor, getStatusLabel } from '../components/ui/Badge';

interface OrderWithDetails extends Order {
  restaurant_name?: string;
  restaurant_logo?: string | null;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, filter]);

  const loadOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering']);
    } else if (filter === 'completed') {
      query = query.in('status', ['delivered', 'cancelled']);
    }

    const { data: ordersData, error } = await query;

    if (error || !ordersData) {
      setLoading(false);
      return;
    }

    const restaurantIds = [...new Set(ordersData.map((o) => o.restaurant_id))];
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, logo_url')
      .in('id', restaurantIds);

    const ordersWithDetails: OrderWithDetails[] = ordersData.map((order) => {
      const restaurant = restaurants?.find((r) => r.id === order.restaurant_id);
      return {
        ...order,
        restaurant_name: restaurant?.name || 'Restaurante',
        restaurant_logo: restaurant?.logo_url,
      };
    });

    setOrders(ordersWithDetails);
    setLoading(false);
  };

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Faça login para ver seus pedidos</h2>
        <Link to="/login" className="text-red-500 hover:text-red-600 font-medium">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pedidos em andamento</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'all' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'active' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Em andamento
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'completed' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Finalizados
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-300 rounded-2xl"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">Que tal pedir algo delicioso?</p>
            <Link to="/restaurants" className="text-red-500 hover:text-red-600 font-medium">
              Ver restaurantes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: OrderWithDetails; onClick: () => void }) {
  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
      case 'preparing':
        return <ChefHat className="w-5 h-5" />;
      case 'ready':
      case 'delivering':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <Card hover onClick={onClick}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
            {order.restaurant_logo ? (
              <img src={order.restaurant_logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">{order.restaurant_name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="font-bold text-red-500 mt-1">R$ {order.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={getStatusColor(order.status)} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusLabel(order.status)}</span>
          </Badge>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
}
