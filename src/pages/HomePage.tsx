import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Truck, MapPin, Utensils, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase, Restaurant, Category } from '../lib/supabase';
import { Card } from '../components/ui/Card';

export function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [restResponse, catResponse] = await Promise.all([
      supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .eq('is_open', true)
        .order('rating', { ascending: false })
        .limit(12),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .limit(8),
    ]);

    if (restResponse.data) setRestaurants(restResponse.data);
    if (catResponse.data) setCategories(catResponse.data);
    setLoading(false);
  };

  const topRated = restaurants.filter((r) => r.rating >= 4.5).slice(0, 4);
  const nearby = restaurants.slice(0, 8);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Seus restaurantes favoritos na palma da sua mão
              </h1>
              <p className="text-lg text-red-100 mb-6">
                Peça sua comida favorita e receba em minutos
              </p>
              <Link
                to="/restaurants"
                className="inline-flex items-center px-6 py-3 bg-white text-red-500 rounded-full font-semibold hover:bg-red-50 transition-all shadow-lg"
              >
                Ver restaurantes
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Comida deliciosa"
                className="rounded-2xl shadow-2xl max-w-md w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">+5000 Restaurantes</h3>
                <p className="text-sm text-gray-600">Variedade para todos os gostos</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Entrega Rápida</h3>
                <p className="text-sm text-gray-600">Em média 30 minutos</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Acompanhamento em Tempo Real</h3>
                <p className="text-sm text-gray-600">Saiba onde está seu pedido</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
            <Link to="/restaurants" className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center">
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/restaurants?category=${category.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-gray-100 hover:border-red-200">
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-12 h-12 mx-auto mb-2 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-700 group-hover:text-red-500 transition-colors">
                    {category.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Em Alta</h2>
            </div>
            <Link to="/restaurants" className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {topRated.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum restaurante disponível ainda</p>
              <Link
                to="/register"
                className="inline-block mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Seja o primeiro a cadastrar um restaurante
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topRated.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurantes Próximos</h2>

          {nearby.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum restaurante encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nearby.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-red-500 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Tem um restaurante?</h2>
          <p className="text-lg text-red-100 mb-6 max-w-2xl mx-auto">
            Cadastre seu restaurante e alcance milhares de clientes na sua região
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-red-500 rounded-full font-bold hover:bg-red-50 transition-all shadow-lg text-lg"
          >
            Começar agora
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
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
