-- ⚠️ FICHIER PÉRIMÉ — NE PAS REJOUER SUR LA BASE DE PRODUCTION ⚠️
--
-- Ce schéma décrit un état antérieur de la base. Les colonnes suivantes ont
-- changé de nom depuis, et les policies ci-dessous les référencent encore :
--
--   vendors.owner_id   →  vendors.user_id
--   vendors.is_active  →  vendors.status  ('active' | 'inactive' | 'suspended')
--   vendors.category   →  vendors.category_id  (FK vers categories)
--
-- Rejouer ce fichier recrée des policies RLS mortes : le vendeur ne peut plus
-- lire sa propre boutique ni créer de produit, et l'admin ne voit plus les
-- boutiques en attente d'approbation. Les correctifs sont dans
-- migrations/fix_vendors_rls.sql et migrations/fix_owner_id_rls.sql.
--
-- Pour régénérer une référence fidèle :  supabase db dump --schema public
--
-- QuickGo Supabase Database Schema
-- Run this in your Supabase SQL editor to set up all tables

-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PROFILES (extends auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT 'Yaoundé',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'driver', 'admin', 'super_admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  cashback_balance NUMERIC(10, 2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profile created on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- VENDORS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category TEXT NOT NULL,
  city TEXT DEFAULT 'Yaoundé',
  address TEXT,
  phone TEXT,
  email TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  delivery_time_min INTEGER DEFAULT 20,
  delivery_time_max INTEGER DEFAULT 45,
  min_order NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors visible to all" ON public.vendors
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owners manage own vendor" ON public.vendors
  FOR ALL USING (auth.uid() = owner_id);

-- ================================================================
-- PRODUCTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  compare_price NUMERIC(10, 2),
  images TEXT[] DEFAULT '{}',
  category TEXT,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products visible to all" ON public.products
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Vendors manage own products" ON public.products
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

-- ================================================================
-- ORDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES public.vendors(id),
  driver_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered', 'cancelled')
  ),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  delivery_address JSONB,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Vendors see their orders" ON public.orders
  FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Customers create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Order status update" ON public.orders
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    auth.uid() = driver_id OR
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

-- ================================================================
-- WALLET / TRANSACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('credit', 'debit', 'cashback', 'transfer', 'withdrawal')),
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2),
  reference TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES public.vendors(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews visible to all" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Customers create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mark read" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- COMMUNICATION LOGS (for email/SMS API)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  channel TEXT CHECK (channel IN ('email', 'sms', 'push', 'whatsapp')),
  type TEXT,
  recipient TEXT,
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'sent',
  provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- REALTIME SUBSCRIPTIONS (enable for live tracking)
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
