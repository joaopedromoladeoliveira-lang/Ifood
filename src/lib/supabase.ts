import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: 'customer' | 'restaurant_owner' | 'delivery_partner' | 'admin';
          avatar_url: string | null;
          balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: 'customer' | 'restaurant_owner' | 'delivery_partner' | 'admin';
          avatar_url?: string | null;
          balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          role?: 'customer' | 'restaurant_owner' | 'delivery_partner' | 'admin';
          avatar_url?: string | null;
          balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          street: string;
          number: string | null;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          street: string;
          number?: string | null;
          complement?: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          street?: string;
          number?: string | null;
          complement?: string | null;
          neighborhood?: string;
          city?: string;
          state?: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          cnpj: string | null;
          logo_url: string | null;
          banner_url: string | null;
          phone: string | null;
          email: string | null;
          street: string;
          number: string | null;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          delivery_fee: number;
          minimum_order: number;
          estimated_delivery_time: number;
          rating: number;
          total_reviews: number;
          is_open: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          cnpj?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          phone?: string | null;
          email?: string | null;
          street: string;
          number?: string | null;
          complement?: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          delivery_fee?: number;
          minimum_order?: number;
          estimated_delivery_time?: number;
          rating?: number;
          total_reviews?: number;
          is_open?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          cnpj?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          phone?: string | null;
          email?: string | null;
          street?: string;
          number?: string | null;
          complement?: string | null;
          neighborhood?: string;
          city?: string;
          state?: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          delivery_fee?: number;
          minimum_order?: number;
          estimated_delivery_time?: number;
          rating?: number;
          total_reviews?: number;
          is_open?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          promotional_price: number | null;
          image_url: string | null;
          is_available: boolean;
          preparation_time: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          promotional_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          promotional_price?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          restaurant_id: string;
          delivery_address_id: string | null;
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          discount: number;
          total: number;
          payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'meal_voucher';
          change_for: number | null;
          notes: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          preparing_at: string | null;
          ready_at: string | null;
          delivering_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          restaurant_id: string;
          delivery_address_id?: string | null;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          discount?: number;
          total: number;
          payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'meal_voucher';
          change_for?: number | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          preparing_at?: string | null;
          ready_at?: string | null;
          delivering_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          restaurant_id?: string;
          delivery_address_id?: string | null;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal?: number;
          delivery_fee?: number;
          discount?: number;
          total?: number;
          payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'meal_voucher';
          change_for?: number | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          preparing_at?: string | null;
          ready_at?: string | null;
          delivering_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          pickup_at: string | null;
          delivered_at: string | null;
          status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          pickup_at?: string | null;
          delivered_at?: string | null;
          status?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          driver_id?: string | null;
          pickup_at?: string | null;
          delivered_at?: string | null;
          status?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
          notes?: string | null;
          created_at?: string;
        };
      };
      withdrawal_settings: {
        Row: {
          id: string;
          setting_name: string;
          withdrawal_fee_percent: number;
          withdrawal_fee_fixed: number;
          minimum_withdrawal: number;
          maximum_withdrawal: number;
          processing_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_name: string;
          withdrawal_fee_percent?: number;
          withdrawal_fee_fixed?: number;
          minimum_withdrawal?: number;
          maximum_withdrawal?: number;
          processing_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_name?: string;
          withdrawal_fee_percent?: number;
          withdrawal_fee_fixed?: number;
          minimum_withdrawal?: number;
          maximum_withdrawal?: number;
          processing_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          fee_percent: number;
          fee_fixed: number;
          total_fee: number;
          net_amount: number;
          status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          payment_method: 'pix' | 'bank_transfer';
          pix_key: string | null;
          bank_name: string | null;
          bank_agency: string | null;
          bank_account: string | null;
          account_holder_name: string | null;
          account_holder_document: string | null;
          admin_notes: string | null;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          fee_percent: number;
          fee_fixed: number;
          total_fee: number;
          net_amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          payment_method?: 'pix' | 'bank_transfer';
          pix_key?: string | null;
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          account_holder_name?: string | null;
          account_holder_document?: string | null;
          admin_notes?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          fee_percent?: number;
          fee_fixed?: number;
          total_fee?: number;
          net_amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          payment_method?: 'pix' | 'bank_transfer';
          pix_key?: string | null;
          bank_name?: string | null;
          bank_agency?: string | null;
          bank_account?: string | null;
          account_holder_name?: string | null;
          account_holder_document?: string | null;
          admin_notes?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          restaurant_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id: string;
          restaurant_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_id?: string;
          restaurant_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          restaurant_id?: string;
          created_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          minimum_order: number;
          max_uses: number | null;
          current_uses: number;
          valid_from: string;
          valid_until: string;
          restaurant_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          minimum_order?: number;
          max_uses?: number | null;
          current_uses?: number;
          valid_from: string;
          valid_until: string;
          restaurant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: 'percentage' | 'fixed';
          discount_value?: number;
          minimum_order?: number;
          max_uses?: number | null;
          current_uses?: number;
          valid_from?: string;
          valid_until?: string;
          restaurant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      is_admin: {
        Args: void;
        Returns: boolean;
      };
      is_restaurant_owner: {
        Args: void;
        Returns: boolean;
      };
      is_delivery_partner: {
        Args: void;
        Returns: boolean;
      };
    };
    Enums: {};
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Delivery = Database['public']['Tables']['deliveries']['Row'];
export type WithdrawalSetting = Database['public']['Tables']['withdrawal_settings']['Row'];
export type Withdrawal = Database['public']['Tables']['withdrawals']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
