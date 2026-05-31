import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, MapPin, Phone, MessageCircle, ChefHat, Truck, CheckCircle, Home, ArrowLeft, Star } from 'lucide-react';
import { supabase, Order, OrderItem, Restaurant, Address } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import { Badge, getStatusColor, getStatusLabel } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface OrderDetails extends Order {
  restaurant?: Restaurant;
  delivery_address?: Address;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<(OrderItem & { menu_item_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadOrder();
    }
  }, [id, user]);

  const loadOrder = async () => {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('customer_id', user!.id)
      .single();

    if (error || !orderData) {
      setLoading(false);
      return;
    }

    const [restaurantRes, addressRes, itemsRes] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', orderData.restaurant_id).single(),
      orderData.delivery_address_id
        ? supabase.from('addresses').select('*').eq('id', orderData.delivery_address_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id!),
    ]);

    setOrder({
      ...orderData,
      restaurant: restaurantRes.data || undefined,
      delivery_address: addressRes.data || undefined,
    });

    if (itemsRes.data) {
      const menuItemIds = itemsRes.data.map((item) => item.menu_item_id);
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, name')
        .in('id', menuItemIds);

      const itemsWithNames = itemsRes.data.map((item) => ({
        ...item,
        menu_item_name: menuItems?.find((m) => m.id === item.menu_item_id)?.name || 'Item',
      }));

      setItems(itemsWithNames);
    }

    setLoading(false);
  };

  const getStatusSteps = () => {
    if (!order) return [];

    const statuses = [
      { key: 'pending', label: 'Recebido', icon: Clock },
      { key: 'confirmed', label: 'Confirmado', icon: CheckCircle },
      { key: 'preparing', label: 'Preparando', icon: ChefHat },
      { key: 'ready', label: 'Pronto', icon: CheckCircle },
      { key: 'delivering', label: 'Saiu para entrega', icon: Truck },
      { key: 'delivered', label: 'Entregue', icon: CheckCircle },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === order?.status);

    return statuses.map((status, index) => ({
      ...status,
      completed: index <= currentIndex || order?.status === 'delivered',
      active: index === currentIndex,
    }));
  };

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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Pedido não encontrado</p>
        <Button onClick={() => navigate('/orders')}>Ver pedidos</Button>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => navigate('/orders')} className="flex items-center mb-4 text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <p className="text-red-100 mt-1">
                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Badge variant={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                {order.restaurant?.logo_url ? (
                  <img src={order.restaurant.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{order.restaurant?.name}</h3>
                  <p className="text-sm text-gray-500">{order.restaurant?.neighborhood}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {order.status !== 'cancelled' && (
              <div className="relative mb-6">
                <div className="flex justify-between items-start">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          step.completed
                            ? 'bg-red-500 text-white'
                            : step.active
                            ? 'bg-red-100 text-red-500'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs mt-2 text-center ${
                          step.completed || step.active ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>

                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-5 left-1/2 right-0 h-0.5 -z-1 ${
                            step.completed ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.delivery_address && (
              <div className="flex items-start space-x-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{order.delivery_address.label}</p>
                  <p className="text-sm">
                    {order.delivery_address.street}, {order.delivery_address.number}
                    {order.delivery_address.complement && ` - ${order.delivery_address.complement}`}
                  </p>
                  <p className="text-sm">
                    {order.delivery_address.neighborhood}, {order.delivery_address.city}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Itens do pedido</h4>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-gray-600">
                  <span>
                    {item.quantity}x {item.menu_item_name}
                    {item.notes && <span className="text-gray-400 text-sm"> ({item.notes})</span>}
                  </span>
                  <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxa de entrega</span>
                <span>R$ {order.delivery_fee.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {order.status === 'delivered' && (
          <Card className="mb-6">
            <CardBody>
              <h4 className="font-semibold text-gray-900 mb-3">Avalie seu pedido</h4>
              <p className="text-gray-600 mb-4">O que você achou do pedido?</p>
              <div className="flex space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-yellow-50 transition-colors"
                  >
                    <Star className="w-6 h-6 text-gray-300 hover:text-yellow-400 fill-current" />
                  </button>
                ))}
              </div>
              <Button variant="outline">Avaliar pedido</Button>
            </CardBody>
          </Card>
        )}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/')} fullWidth>
            <Home className="w-5 h-5 mr-2" />
            Ir para início
          </Button>
          <Button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)} fullWidth>
            Pedir novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
