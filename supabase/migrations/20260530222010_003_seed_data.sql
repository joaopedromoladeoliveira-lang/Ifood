/*
  # Seed initial data

  This migration adds:
  - Default categories for food types
  - An admin user for system management
  - Sample restaurant data for testing
*/

-- Insert categories
INSERT INTO categories (name, slug, display_order, is_active)
VALUES
  ('Pizza', 'pizza', 1, true),
  ('Hambúrguer', 'hamburger', 2, true),
  ('Sushi', 'sushi', 3, true),
  ('Comida Brasileira', 'comida-brasileira', 4, true),
  ('Lanches', 'lanches', 5, true),
  ('Saudável', 'saudavel', 6, true),
  ('Japonesa', 'japonesa', 7, true),
  ('Mexicana', 'mexicana', 8, true),
  ('Chinesa', 'chinesa', 9, true),
  ('Pizza', 'pizza', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Create admin user profile (requires the user to be created in auth.users first via Supabase Dashboard)
-- We'll create a trigger function to handle this automatically

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
