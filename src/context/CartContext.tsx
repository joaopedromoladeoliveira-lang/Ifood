import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '../lib/supabase';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ifood_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || null);
        setDeliveryFee(parsed.deliveryFee || 0);
      } catch (e) {
        console.error('Failed to parse cart from storage');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, restaurantId, restaurantName, deliveryFee })
    );
  }, [items, restaurantId, restaurantName, deliveryFee]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.menuItem.promotional_price || item.menuItem.price;
    return sum + price * item.quantity;
  }, 0);

  const total = subtotal + deliveryFee;

  const addItem = (menuItem: MenuItem, restId: string, restName: string, notes?: string) => {
    setItems((prevItems) => {
      if (restaurantId && restaurantId !== restId) {
        setRestaurantId(restId);
        setRestaurantName(restName);
        return [{ menuItem, quantity: 1, notes, restaurantId: restId, restaurantName: restName }];
      }

      if (!restaurantId) {
        setRestaurantId(restId);
        setRestaurantName(restName);
      }

      const existingItem = prevItems.find(
        (item) => item.menuItem.id === menuItem.id && item.notes === notes
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.menuItem.id === menuItem.id && item.notes === notes
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { menuItem, quantity: 1, notes, restaurantId: restId, restaurantName: restName }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.menuItem.id !== itemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
        setDeliveryFee(0);
      }
      return newItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItem.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    setDeliveryFee(0);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        subtotal,
        deliveryFee,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
