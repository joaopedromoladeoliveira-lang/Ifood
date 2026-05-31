import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Truck,
  MapPin,
  Phone,
  ChevronLeft,
  Plus,
  Minus,
  ShoppingCart,
  Info,
  Tag,
  Search,
} from 'lucide-react';
import { supabase, Restaurant, MenuItem, Category } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addItem, restaurantId: cartRestaurantId, setDeliveryFee } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemModal, setShowItemModal] = useState<MenuItem | null>(null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (id) {
      loadRestaurantData();
    }
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      setDeliveryFee(restaurant.delivery_fee);
    }
  }, [restaurant]);

  const loadRestaurantData = async () => {
    const [restResponse, menuResponse] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', id).single(),
      supabase.from('menu_items').select('*').eq('restaurant_id', id).eq('is_available', true),
    ]);

    if (restResponse.data) setRestaurant(restResponse.data);
    if (menuResponse.data) {
      setMenuItems(menuResponse.data);

      const uniqueCategoryIds = [...new Set(menuResponse.data.map((item) => item.category_id).filter(Boolean))];
      if (uniqueCategoryIds.length > 0) {
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .in('id', uniqueCategoryIds);
        if (catData) setCategories(catData);
      }
    }

    setLoading(false);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    const items = filteredItems.filter((item) => item.category_id === category.id);
    if (items.length > 0) {
      acc.push({ category, items });
    }
    return acc;
  }, [] as { category: Category; items: MenuItem[] }[]);

  const uncategorizedItems = filteredItems.filter((item) => !item.category_id);
  if (uncategorizedItems.length > 0) {
    groupedItems.push({
      category: { id: 'other', name: 'Outros', slug: 'outros', icon_url: null, display_order: 99, is_active: true, created_at: '' },
      items: uncategorizedItems,
    });
  }

  const handleAddToCart = (item: MenuItem, quantity: number = 1, notes?: string) => {
    if (!restaurant) return;

    if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
      const confirmSwitch = window.confirm(
        'Você tem itens de outro restaurante no carrinho. Deseja limpar o carrinho e adicionar itens deste restaurante?'
      );
      if (!confirmSwitch) return;
    }

    addItem(item, restaurant.id, restaurant.name, notes);
    setShowItemModal(null);
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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">Restaurante não encontrado</p>
        <Button onClick={() => navigate('/restaurants')}>Ver restaurantes</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 sm:h-80">
        <img
          src={
            restaurant.banner_url ||
            'https://images.pexels.com/photos/674685/pexels-photo-674685.jpeg?auto=compress&cs=tinysrgb&w=1200'
          }
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 sm:left-8">
          <div className="flex items-end space-x-4">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-20 h-20 rounded-xl border-4 border-white object-cover shadow-lg"
              />
            )}
            <div className="flex-1 text-white pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-white/80">{restaurant.neighborhood}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-1 bg-white px-3 py-2 rounded-lg shadow-sm">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({restaurant.total_reviews})</span>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm text-gray-700">
            <Clock className="w-5 h-5" />
            <span>{restaurant.estimated_delivery_time} min</span>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm text-gray-700">
            <Truck className="w-5 h-5" />
            <span>R$ {restaurant.delivery_fee.toFixed(2)}</span>
          </div>

          {restaurant.minimum_order > 0 && (
            <Badge variant="info">Pedido mín: R$ {restaurant.minimum_order.toFixed(2)}</Badge>
          )}

          {!restaurant.is_open && <Badge variant="danger">Fechado</Badge>}
        </div>

        {restaurant.description && (
          <p className="text-gray-600 mb-6">{restaurant.description}</p>
        )}

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems.map(({ category, items }) => (
              <div key={category.id}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-red-500" />
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAdd={() => setShowItemModal(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-5xl mx-auto">
            <Button fullWidth onClick={() => navigate('/cart')} className="justify-between">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                <span>Ver carrinho</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{itemCount}</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {showItemModal && (
        <ItemModal item={showItemModal} onClose={() => setShowItemModal(null)} onAdd={handleAddToCart} />
      )}
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const price = item.promotional_price || item.price;

  return (
    <Card hover className="flex overflow-hidden" onClick={onAdd}>
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              <span className="font-bold text-red-500">R$ {price.toFixed(2)}</span>
              {item.promotional_price && (
                <span className="text-sm text-gray-400 line-through">R$ {item.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          {item.image_url && (
            <div className="w-20 h-20 ml-3 rounded-lg overflow-hidden flex-shrink-0">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ItemModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (item: MenuItem, quantity: number, notes?: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const price = item.promotional_price || item.price;
  const total = price * quantity;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {item.image_url && (
          <div className="relative h-64">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <span className="text-gray-600 text-xl">×</span>
            </button>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
          <p className="text-sm text-gray-500 mt-2">{item.description}</p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-500">R$ {price.toFixed(2)}</span>
              {item.promotional_price && (
                <span className="text-sm text-gray-400 line-through">R$ {item.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem cebola, bem passado..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="font-semibold text-gray-700">Quantidade</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button
              fullWidth
              onClick={() => onAdd(item, quantity, notes || undefined)}
              className="text-lg"
            >
              Adicionar R$ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
