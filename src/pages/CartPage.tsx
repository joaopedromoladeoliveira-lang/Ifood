import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ChevronRight, MapPin, CreditCard, Clock, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase, Address } from '../lib/supabase';
import { Card, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export function CartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, restaurantName, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'meal_voucher'>('pix');
  const [changeFor, setChangeFor] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false });

    if (data) {
      setAddresses(data);
      const defaultAddress = data.find((a) => a.is_default) || data[0];
      if (defaultAddress) setSelectedAddress(defaultAddress);
    }
  };

  const handleCheckout = async () => {
    if (!user || !selectedAddress || items.length === 0) return;

    setLoading(true);

    try {
      const restaurantId = items[0].restaurantId;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurantId,
          delivery_address_id: selectedAddress.id,
          status: 'pending',
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethod,
          change_for: paymentMethod === 'cash' && changeFor ? parseFloat(changeFor) : null,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error('Erro ao criar pedido');
      }

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.promotional_price || item.menuItem.price,
        total_price: (item.menuItem.promotional_price || item.menuItem.price) * item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        throw new Error('Erro ao adicionar itens ao pedido');
      }

      clearCart();
      navigate(`/orders/${orderData.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao finalizar pedido. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-24 h-24 text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-600 mb-6">Adicione itens de um restaurante para continuar</p>
        <Button onClick={() => navigate('/restaurants')}>
          Ver restaurantes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{restaurantName}</h1>
          <span className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            {items.reduce((sum, item) => sum + item.quantity, 0)} itens
          </span>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <Card key={`${item.menuItem.id}-${item.notes}`}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.menuItem.name}</h3>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                    )}
                    <p className="text-red-500 font-bold mt-2">
                      R$ {(item.menuItem.promotional_price || item.menuItem.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="w-8 h-8 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          <button
            onClick={clearCart}
            className="w-full text-red-500 hover:text-red-600 font-medium py-2"
          >
            Limpar carrinho
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Tempo estimado</h3>
              </div>
              <p className="text-gray-600 ml-8">30-45 minutos</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Endereço de entrega</h3>
              </div>

              {!user ? (
                <div className="ml-8 space-y-3">
                  <p className="text-gray-600">Faça login para selecionar um endereço</p>
                  <Button onClick={() => navigate('/login')}>Entrar</Button>
                </div>
              ) : addresses.length === 0 ? (
                <div className="ml-8 space-y-3">
                  <p className="text-gray-600">Cadastre um endereço para entrega</p>
                  <Button onClick={() => navigate('/addresses')}>Adicionar endereço</Button>
                </div>
              ) : (
                <div className="ml-8 space-y-2">
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => setSelectedAddress(address)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedAddress?.id === address.id
                          ? 'bg-red-50 border-2 border-red-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {address.label} {address.is_default && <span className="text-xs text-gray-500">(padrão)</span>}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.neighborhood}, {address.city}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Forma de pagamento</h3>
              </div>

              <div className="ml-8 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'pix', label: 'PIX' },
                    { value: 'credit_card', label: 'Crédito' },
                    { value: 'debit_card', label: 'Débito' },
                    { value: 'meal_voucher', label: 'VR/VA' },
                    { value: 'cash', label: 'Dinheiro' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        paymentMethod === method.value
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <Input
                    label="Precisa de troco para?"
                    type="number"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    placeholder="Ex: 100.00"
                    className="mt-4"
                  />
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Por favor, toca 2 vezes na chegada..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows={3}
              />
            </CardBody>
          </Card>
        </div>

        <Card className="sticky bottom-4">
          <CardBody className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxa de entrega</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <Button
              fullWidth
              loading={loading}
              disabled={!user || !selectedAddress}
              onClick={handleCheckout}
              className="mt-4"
            >
              Finalizar pedido
            </Button>

            {!user && (
              <p className="text-sm text-center text-gray-500">
                Faça login para finalizar seu pedido
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
