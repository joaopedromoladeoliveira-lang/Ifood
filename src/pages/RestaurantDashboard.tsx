import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Plus,
  Edit2,
  Eye,
} from 'lucide-react';
import { supabase, Restaurant, Order, MenuItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge, getStatusColor, getStatusLabel } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface OrderWithCustomer extends Order {
  customer_name?: string;
}

export function RestaurantDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'orders' | 'menu'>('dashboard');

  useEffect(() => {
    if (user && profile?.role === 'restaurant_owner') {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    const { data: restData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user!.id)
      .single();

    if (!restData) {
      setLoading(false);
      return;
    }

    setRestaurant(restData);

    const [ordersRes, menuRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, profiles!orders_customer_id_fkey(full_name)')
        .eq('restaurant_id', restData.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('display_order'),
    ]);

    if (ordersRes.data) {
      const ordersWithCustomer = ordersRes.data.map((order) => ({
        ...order,
        customer_name: order.profiles?.full_name || 'Cliente',
      }));
      setOrders(ordersWithCustomer);
    }

    if (menuRes.data) setMenuItems(menuRes.data);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const now = new Date().toISOString();
    const updateData: any = { status };

    if (status === 'confirmed') updateData.confirmed_at = now;
    if (status === 'preparing') updateData.preparing_at = now;
    if (status === 'ready') updateData.ready_at = now;

    await supabase.from('orders').update(updateData).eq('id', orderId);
    await loadData();
  };

  const toggleMenuItemAvailability = async (itemId: string, isAvailable: boolean) => {
    await supabase.from('menu_items').update({ is_available: !isAvailable }).eq('id', itemId);
    await loadData();
  };

  if (!user || profile?.role !== 'restaurant_owner') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-500 rounded-2xl"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ChefHat className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Você ainda não tem um restaurante</h2>
        <p className="text-gray-600 mb-4">Crie seu restaurante para começar a vender</p>
        <Button onClick={() => navigate('/restaurant-setup')}>Criar restaurante</Button>
      </div>
    );
  }

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  );

  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.created_at).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-red-500" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant={restaurant.is_open ? 'success' : 'danger'}>
                    {restaurant.is_open ? 'Aberto' : 'Fechado'}
                  </Badge>
                  <Badge variant="info">{restaurant.rating.toFixed(1)} ⭐</Badge>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={restaurant.is_open ? 'danger' : 'success'}
                onClick={async () => {
                  await supabase
                    .from('restaurants')
                    .update({ is_open: !restaurant.is_open })
                    .eq('id', restaurant.id);
                  await loadData();
                }}
              >
                {restaurant.is_open ? 'Fechar' : 'Abrir'} restaurante
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex space-x-2">
            {(['dashboard', 'orders', 'menu'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === v ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {v === 'dashboard' && <><LayoutDashboard className="w-4 h-4 inline mr-2" />Dashboard</>}
                {v === 'orders' && <><Package className="w-4 h-4 inline mr-2" />Pedidos</>}
                {v === 'menu' && <><ChefHat className="w-4 h-4 inline mr-2" />Cardápio</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos Hoje</p>
                      <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-red-500" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Receita Hoje</p>
                      <p className="text-3xl font-bold text-green-600">R$ {todayRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos Ativos</p>
                      <p className="text-3xl font-bold text-amber-600">{activeOrders.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h3 className="font-bold text-gray-900">Pedidos Recentes</h3>
              </CardHeader>
              <CardBody>
                {activeOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum pedido ativo</p>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{order.customer_name}</p>
                          <p className="text-sm text-gray-500">
                            R$ {order.total.toFixed(2)} - {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            >
                              Confirmar
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                            >
                              Preparar
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                            >
                              Pronto
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {view === 'orders' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Todos os Pedidos</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum pedido ainda
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                          <p className="text-lg font-bold text-red-500 mt-1">R$ {order.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {order.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                                Confirmar
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                                Cancelar
                              </Button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                              Iniciar preparo
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button size="sm" variant="success" onClick={() => updateOrderStatus(order.id, 'ready')}>
                              Pronto
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cardápio</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar item
              </Button>
            </div>

            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum item no cardápio ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id}>
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                          <p className="font-bold text-red-500 mt-2">
                            R$ {(item.promotional_price || item.price).toFixed(2)}
                          </p>
                        </div>
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover ml-3" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <Badge variant={item.is_available ? 'success' : 'danger'}>
                          {item.is_available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleMenuItemAvailability(item.id, item.is_available)}
                            className="text-xs text-gray-600 hover:text-red-500"
                          >
                            {item.is_available ? 'Desativar' : 'Ativar'}
                          </button>
                          <button className="text-xs text-gray-600 hover:text-red-500">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
