import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Clock, Truck, Search, Filter, Grid, List, Utensils, X } from 'lucide-react';
import { supabase, Restaurant, Category } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (data) setCategories(data);
  };

  const loadRestaurants = async () => {
    setLoading(true);

    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true);

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (!error && data) {
      if (selectedCategory) {
        const { data: restCats } = await supabase
          .from('restaurant_categories')
          .select('restaurant_id')
          .eq('category_id', selectedCategory);

        if (restCats) {
          const filteredIds = restCats.map((rc) => rc.restaurant_id);
          setRestaurants(data.filter((r) => filteredIds.includes(r.id)));
        } else {
          setRestaurants(data);
        }
      } else {
        setRestaurants(data);
      }
    }

    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRestaurants();
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory('');
      setSearchParams({});
    } else {
      setSelectedCategory(categoryId);
      setSearchParams({ category: categoryId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurantes</h1>
            <p className="text-gray-600 mt-1">{restaurants.length} restaurantes encontrados</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar restaurantes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>

            <Button
              type="button"
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </Button>
          </form>
        </div>

        {showFilters && (
          <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Categorias</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
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
          </div>
        )}

        {selectedCategory && (
          <div className="mb-6 flex items-center space-x-2">
            <span className="text-gray-600">Filtrando por:</span>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchParams({});
              }}
              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
            >
              {categories.find((c) => c.id === selectedCategory)?.name}
              <X className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-2xl"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-gray-600 mb-4">Tente ajustar seus filtros de busca</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSearchParams({});
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link to={`/restaurant/${restaurant.id}`}>
      <Card hover className="overflow-hidden">
        <div className="relative h-40">
          <img
            src={
              restaurant.banner_url ||
              restaurant.logo_url ||
              'https://images.pexels.com/photos/674685/pexels-photo-674685.jpeg?auto=compress&cs=tinysrgb&w=400'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="absolute bottom-2 left-2 w-16 h-16 rounded-xl border-2 border-white object-cover shadow-lg"
            />
          )}
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg flex items-center space-x-1 shadow">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm text-gray-900">{restaurant.rating.toFixed(1)}</span>
          </div>
          {!restaurant.is_open && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Fechado</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{restaurant.name}</h3>
          <p className="text-sm text-gray-500 mb-2">{restaurant.neighborhood}</p>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {restaurant.estimated_delivery_time} min
            </div>
            <div className="flex items-center">
              <Truck className="w-4 h-4 mr-1" />
              R$ {restaurant.delivery_fee.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function RestaurantListItem({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link to={`/restaurant/${restaurant.id}`}>
      <Card hover className="flex overflow-hidden">
        <div className="relative w-48 h-32 flex-shrink-0">
          <img
            src={
              restaurant.banner_url ||
              restaurant.logo_url ||
              'https://images.pexels.com/photos/674685/pexels-photo-674685.jpeg?auto=compress&cs=tinysrgb&w=400'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          {!restaurant.is_open && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold">Fechado</span>
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{restaurant.name}</h3>
              <p className="text-sm text-gray-500">{restaurant.neighborhood}</p>
              {restaurant.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{restaurant.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg shadow">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-sm text-gray-900">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600 mt-3">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {restaurant.estimated_delivery_time} min
            </div>
            <div className="flex items-center">
              <Truck className="w-4 h-4 mr-1" />
              R$ {restaurant.delivery_fee.toFixed(2)}
            </div>
            {restaurant.minimum_order > 0 && (
              <div className="flex items-center">
                Pedido mínimo: R$ {restaurant.minimum_order.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
