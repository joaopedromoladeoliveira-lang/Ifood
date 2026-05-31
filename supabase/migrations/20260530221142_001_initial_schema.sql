/*
  # Initial Schema for iFood Clone

  1. New Tables
    - `profiles` - User profiles with role differentiation (customer, restaurant_owner, delivery_partner, admin)
    - `restaurants` - Restaurant information including operating hours and location
    - `categories` - Food categories (Pizza, Burgers, Sushi, etc.)
    - `restaurant_categories` - Many-to-many relationship between restaurants and categories
    - `menu_items` - Menu items with pricing and availability
    - `orders` - Customer orders with status tracking
    - `order_items` - Individual items within an order
    - `addresses` - Delivery addresses for customers
    - `deliveries` - Delivery assignments to drivers
    - `withdrawal_settings` - Admin configurable withdrawal fees and minimum amounts
    - `withdrawals` - Withdrawal requests from restaurant owners and drivers
  
  2. Security
    - Enable RLS on all tables
    - Policies ensure users can only access their own data
    - Restaurant owners can only manage their own restaurants
    - Admins have full access to all tables
    - Customers can view restaurants and place orders
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'restaurant_owner', 'delivery_partner', 'admin')),
  avatar_url text,
  balance decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  label text DEFAULT 'Home',
  street text NOT NULL,
  number text,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  latitude decimal(9,6),
  longitude decimal(9,6),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_url text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  cnpj text UNIQUE,
  logo_url text,
  banner_url text,
  phone text,
  email text,
  street text NOT NULL,
  number text,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  latitude decimal(9,6),
  longitude decimal(9,6),
  delivery_fee decimal(6,2) DEFAULT 5.00,
  minimum_order decimal(10,2) DEFAULT 0,
  estimated_delivery_time int DEFAULT 30,
  rating decimal(3,2) DEFAULT 0,
  total_reviews int DEFAULT 0,
  is_open boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Restaurant categories junction table
CREATE TABLE IF NOT EXISTS restaurant_categories (
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (restaurant_id, category_id)
);

-- Operating hours table
CREATE TABLE IF NOT EXISTS operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean DEFAULT false,
  UNIQUE (restaurant_id, day_of_week)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  promotional_price decimal(10,2),
  image_url text,
  is_available boolean DEFAULT true,
  preparation_time int DEFAULT 15,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  delivery_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
  subtotal decimal(10,2) NOT NULL,
  delivery_fee decimal(6,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'meal_voucher')),
  change_for decimal(10,2),
  notes text,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  delivering_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  driver_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  pickup_at timestamptz,
  delivered_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Withdrawal settings (admin configurable)
CREATE TABLE IF NOT EXISTS withdrawal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  withdrawal_fee_percent decimal(5,2) DEFAULT 5.00,
  withdrawal_fee_fixed decimal(6,2) DEFAULT 2.00,
  minimum_withdrawal decimal(10,2) DEFAULT 50.00,
  maximum_withdrawal decimal(10,2) DEFAULT 10000.00,
  processing_days int DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default withdrawal settings
INSERT INTO withdrawal_settings (setting_name, withdrawal_fee_percent, withdrawal_fee_fixed, minimum_withdrawal, maximum_withdrawal)
VALUES ('restaurant_owner', 5.00, 2.00, 50.00, 10000.00),
       ('delivery_partner', 3.00, 1.00, 30.00, 5000.00)
ON CONFLICT (setting_name) DO NOTHING;

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  fee_percent decimal(5,2) NOT NULL,
  fee_fixed decimal(6,2) NOT NULL,
  total_fee decimal(10,2) NOT NULL,
  net_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'bank_transfer')),
  pix_key text,
  bank_name text,
  bank_agency text,
  bank_account text,
  account_holder_name text,
  account_holder_document text,
  admin_notes text,
  processed_by uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  customer_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10,2) NOT NULL,
  minimum_order decimal(10,2) DEFAULT 0,
  max_uses int,
  current_uses int DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is restaurant owner
CREATE OR REPLACE FUNCTION is_restaurant_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'restaurant_owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is delivery partner
CREATE OR REPLACE FUNCTION is_delivery_partner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'delivery_partner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Addresses policies
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Categories policies (public read, admin manage)
CREATE POLICY "Anyone can read active categories"
  ON categories FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Restaurants policies
CREATE POLICY "Anyone can read active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true OR is_admin() OR auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can manage own restaurants"
  ON restaurants FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR is_admin())
  WITH CHECK (auth.uid() = owner_id OR is_admin());

CREATE POLICY "Restaurant owners can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (is_restaurant_owner() OR is_admin());

-- Restaurant categories policies
CREATE POLICY "Anyone can read restaurant categories"
  ON restaurant_categories FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage categories for own restaurants"
  ON restaurant_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  );

-- Operating hours policies
CREATE POLICY "Anyone can read operating hours"
  ON operating_hours FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage operating hours"
  ON operating_hours FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  );

-- Menu items policies
CREATE POLICY "Anyone can read available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true OR is_admin() OR 
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Restaurant owners can manage menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND (owner_id = auth.uid() OR is_admin()))
  );

-- Orders policies
CREATE POLICY "Customers can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id OR is_admin() OR
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM deliveries WHERE order_id = orders.id AND driver_id = auth.uid())
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id AND status = 'pending')
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Restaurant owners can update orders for their restaurants"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Order items policies
CREATE POLICY "Users can read order items for accessible orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (
      customer_id = auth.uid() OR is_admin() OR
      EXISTS (SELECT 1 FROM restaurants WHERE id = orders.restaurant_id AND owner_id = auth.uid())
    ))
  );

CREATE POLICY "Customers can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  );

-- Deliveries policies
CREATE POLICY "Delivery partners can read own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid() OR is_admin() OR
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM orders JOIN restaurants ON restaurants.id = orders.restaurant_id WHERE orders.id = deliveries.order_id AND owner_id = auth.uid())
  );

CREATE POLICY "Delivery partners can update assigned deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid() OR is_admin())
  WITH CHECK (driver_id = auth.uid() OR is_admin());

CREATE POLICY "System manages delivery creation"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR is_delivery_partner());

-- Withdrawal settings policies
CREATE POLICY "Admins can manage withdrawal settings"
  ON withdrawal_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can read withdrawal settings for their role"
  ON withdrawal_settings FOR SELECT
  TO authenticated
  USING (is_admin() OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('restaurant_owner', 'delivery_partner'))
  );

-- Withdrawals policies
CREATE POLICY "Users can read own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can create withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own pending withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Admins can manage all withdrawals"
  ON withdrawals FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Reviews policies
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews for own orders"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Favorites policies
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coupons policies
CREATE POLICY "Anyone can read active coupons"
  ON coupons FOR SELECT
  USING (is_active = true OR is_admin() OR 
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Restaurant owners can manage own coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    restaurant_id IS NULL OR 
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()) OR 
    is_admin()
  )
  WITH CHECK (
    restaurant_id IS NULL OR 
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()) OR 
    is_admin()
  );

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);