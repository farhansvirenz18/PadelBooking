-- ============================================
-- Aero Padel Database Schema
-- Drop all tables and recreate with sample data
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (reverse dependency order)
-- ============================================
DROP TABLE IF EXISTS shop_order_items CASCADE;
DROP TABLE IF EXISTS shop_orders CASCADE;
DROP TABLE IF EXISTS shop_products CASCADE;
DROP TABLE IF EXISTS shop_categories CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS tournament_registrations CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS coach_bookings CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS user_memberships CASCADE;
DROP TABLE IF EXISTS membership_tiers CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'coach')),
  padel_level DECIMAL(3,1) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COURTS
-- ============================================
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('indoor', 'outdoor')),
  price_per_hour_peak DECIMAL(10,2) NOT NULL,
  price_per_hour_offpeak DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  images TEXT[],
  amenities TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TIME SLOTS
-- ============================================
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_peak BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, date, start_time)
);

-- ============================================
-- 4. BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  court_id UUID REFERENCES courts(id),
  time_slot_id UUID REFERENCES time_slots(id),
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  duration_hours DECIMAL(3,1),
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  midtrans_order_id TEXT,
  midtrans_snap_token TEXT,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. MEMBERSHIP TIERS
-- ============================================
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  priority_booking_days INT DEFAULT 0,
  free_credits INT DEFAULT 0,
  perks TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. USER MEMBERSHIPS
-- ============================================
CREATE TABLE user_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tier_id UUID REFERENCES membership_tiers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  credits_remaining INT DEFAULT 0,
  midtrans_order_id TEXT,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. COACHES
-- ============================================
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. COACH BOOKINGS
-- ============================================
CREATE TABLE coach_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_type TEXT CHECK (lesson_type IN ('private', 'semi_private', 'group', 'clinic')),
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  midtrans_order_id TEXT,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  participants_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TOURNAMENTS
-- ============================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  format TEXT CHECK (format IN ('americano', 'mexicano', 'round_robin', 'single_elimination', 'double_elimination', 'group_knockout')),
  level_min DECIMAL(3,1) DEFAULT 0.0,
  level_max DECIMAL(3,1) DEFAULT 7.0,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  max_participants INT,
  current_participants INT DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  tournament_date DATE NOT NULL,
  registration_deadline DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registering', 'in_progress', 'completed', 'cancelled')),
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TOURNAMENT REGISTRATIONS
-- ============================================
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES users(id),
  team_name TEXT,
  partner_name TEXT,
  partner_level DECIMAL(3,1),
  notes TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  midtrans_order_id TEXT,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'eliminated', 'winner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ============================================
-- 11. SHOP CATEGORIES
-- ============================================
CREATE TABLE shop_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- ============================================
-- 12. SHOP PRODUCTS
-- ============================================
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES shop_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[],
  brand TEXT,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. SHOP ORDERS
-- ============================================
CREATE TABLE shop_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  midtrans_order_id TEXT,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. SHOP ORDER ITEMS
-- ============================================
CREATE TABLE shop_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES shop_orders(id),
  product_id UUID REFERENCES shop_products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- ============================================
-- 15. VOUCHERS
-- ============================================
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_time_slots_court_date ON time_slots(court_id, date);
CREATE INDEX idx_time_slots_date_status ON time_slots(date, status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_coach_bookings_user ON coach_bookings(user_id);
CREATE INDEX idx_coach_bookings_coach ON coach_bookings(coach_id);
CREATE INDEX idx_tournament_reg_user ON tournament_registrations(user_id);
CREATE INDEX idx_shop_orders_user ON shop_orders(user_id);
CREATE INDEX idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_shop_products_updated_at BEFORE UPDATE ON shop_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_shop_orders_updated_at BEFORE UPDATE ON shop_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-SYNC USER FROM AUTH
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- HELPER: Check if current user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ATOMIC RPC FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock INTO current_stock FROM shop_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND OR current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  UPDATE shop_products SET stock = stock - p_quantity WHERE id = p_product_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_tournament_participants(p_tournament_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_p INT;
  current_p INT;
BEGIN
  SELECT max_participants, current_participants INTO max_p, current_p
  FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  IF max_p IS NOT NULL AND current_p >= max_p THEN
    RETURN FALSE;
  END IF;
  UPDATE tournaments SET current_participants = current_participants + 1 WHERE id = p_tournament_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (public.check_is_admin());

-- Courts
CREATE POLICY "Courts are publicly readable" ON courts FOR SELECT USING (true);
CREATE POLICY "Admins can manage courts" ON courts FOR ALL USING (public.check_is_admin());

-- Time slots
CREATE POLICY "Time slots are publicly readable" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage time slots" ON time_slots FOR ALL USING (public.check_is_admin());

-- Bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (public.check_is_admin());
CREATE POLICY "Admins can manage bookings" ON bookings FOR ALL USING (public.check_is_admin());

-- Membership tiers
CREATE POLICY "Membership tiers are publicly readable" ON membership_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage tiers" ON membership_tiers FOR ALL USING (public.check_is_admin());

-- User memberships
CREATE POLICY "Users can view own memberships" ON user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create memberships" ON user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage memberships" ON user_memberships FOR ALL USING (public.check_is_admin());

-- Coaches
CREATE POLICY "Coaches are publicly readable" ON coaches FOR SELECT USING (true);
CREATE POLICY "Admins can manage coaches" ON coaches FOR ALL USING (public.check_is_admin());

-- Coach bookings
CREATE POLICY "Users can view own coach bookings" ON coach_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create coach bookings" ON coach_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage coach bookings" ON coach_bookings FOR ALL USING (public.check_is_admin());

-- Tournaments
CREATE POLICY "Tournaments are publicly readable" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournaments" ON tournaments FOR ALL USING (public.check_is_admin());

-- Tournament registrations
CREATE POLICY "Users can view own registrations" ON tournament_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for tournaments" ON tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage registrations" ON tournament_registrations FOR ALL USING (public.check_is_admin());

-- Shop categories
CREATE POLICY "Shop categories are publicly readable" ON shop_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON shop_categories FOR ALL USING (public.check_is_admin());

-- Shop products
CREATE POLICY "Shop products are publicly readable" ON shop_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON shop_products FOR ALL USING (public.check_is_admin());

-- Shop orders
CREATE POLICY "Users can view own orders" ON shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON shop_orders FOR ALL USING (public.check_is_admin());

-- Shop order items
CREATE POLICY "Users can view own order items" ON shop_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM shop_orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON shop_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM shop_orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage order items" ON shop_order_items FOR ALL USING (public.check_is_admin());

-- Vouchers
CREATE POLICY "Admins can manage vouchers" ON vouchers FOR ALL USING (public.check_is_admin());

-- ============================================
-- SAMPLE DATA
-- ============================================

-- USERS (admin + coaches + regular users)
INSERT INTO users (id, email, first_name, last_name, phone, avatar_url, role, padel_level) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@aeropadel.com', 'Admin', 'Aero', '08123456789', NULL, 'admin', 5.0),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'coach.rizky@aeropadel.com', 'Rizky', 'Pratama', '08123456790', NULL, 'coach', 6.5),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'coach.maya@aeropadel.com', 'Maya', 'Sari', '08123456791', NULL, 'coach', 7.0),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'farhan@email.com', 'Farhan', 'Virrenz', '08987654321', NULL, 'user', 3.5),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'sari@email.com', 'Sari', 'Dewi', '08987654322', NULL, 'user', 4.0),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'budi@email.com', 'Budi', 'Santoso', '08987654323', NULL, 'user', 2.5),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'luna@email.com', 'Luna', 'Putri', '08987654324', NULL, 'user', 5.0),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'andi@email.com', 'Andi', 'Wijaya', '08987654325', NULL, 'user', 3.0);

-- COURTS
INSERT INTO courts (id, name, description, type, price_per_hour_peak, price_per_hour_offpeak, image_url, amenities, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Court A - Center Court', 'Lapangan utama dengan surface artificial grass premium', 'indoor', 150000, 100000, '/images/court-a.jpg', ARRAY['Racquet rental', 'Water dispenser', 'Changing room', 'Parking'], 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Court B - Arena', 'Lapangan indoor dengan pencahayaan LED', 'indoor', 150000, 100000, '/images/court-b.jpg', ARRAY['Racquet rental', 'Shower', 'Lockers', 'WiFi'], 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Court C - Open Air', 'Lapangan outdoor dengan pemandangan taman', 'outdoor', 120000, 80000, '/images/court-c.jpg', ARRAY['Parking', 'Cafe nearby', 'Water dispenser'], 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Court D - Training', 'Lapangan khusus latihan dan coaching', 'indoor', 130000, 90000, '/images/court-d.jpg', ARRAY['Ball machine', 'Video analysis', 'Changing room'], 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Court E - Premium', 'Lapangan premium VIP dengan AC', 'indoor', 200000, 150000, '/images/court-e.jpg', ARRAY['AC', 'Private lounge', 'Towel service', 'Parking'], 'maintenance');

-- TIME SLOTS (for next 7 days on Court A and Court B)
INSERT INTO time_slots (court_id, date, start_time, end_time, is_peak, price, status)
SELECT
  c.id,
  d.date_val,
  make_time(h, 0, 0),
  make_time(h + 1, 0, 0),
  CASE WHEN h BETWEEN 17 AND 20 THEN true ELSE false END,
  CASE WHEN h BETWEEN 17 AND 20 THEN c.price_per_hour_peak ELSE c.price_per_hour_offpeak END,
  'available'
FROM courts c
CROSS JOIN (
  SELECT CURRENT_DATE + n AS date_val
  FROM generate_series(0, 6) AS n
) d
CROSS JOIN generate_series(7, 21) AS h
WHERE c.id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (court_id, date, start_time) DO NOTHING;

-- BOOKINGS
INSERT INTO bookings (user_id, court_id, time_slot_id, booking_date, start_time, end_time, duration_hours, total_price, status, payment_status) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM time_slots WHERE court_id = '11111111-1111-1111-1111-111111111111' AND date = CURRENT_DATE + 1 AND start_time = '09:00:00' LIMIT 1),
    CURRENT_DATE + 1, '09:00:00', '10:00:00', 1.0, 100000, 'confirmed', 'paid'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM time_slots WHERE court_id = '11111111-1111-1111-1111-111111111111' AND date = CURRENT_DATE + 1 AND start_time = '10:00:00' LIMIT 1),
    CURRENT_DATE + 1, '10:00:00', '11:00:00', 1.0, 100000, 'confirmed', 'paid'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM time_slots WHERE court_id = '22222222-2222-2222-2222-222222222222' AND date = CURRENT_DATE + 2 AND start_time = '14:00:00' LIMIT 1),
    CURRENT_DATE + 2, '14:00:00', '15:00:00', 1.0, 100000, 'pending', 'unpaid'),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM time_slots WHERE court_id = '11111111-1111-1111-1111-111111111111' AND date = CURRENT_DATE + 1 AND start_time = '18:00:00' LIMIT 1),
    CURRENT_DATE + 1, '18:00:00', '19:00:00', 1.0, 150000, 'confirmed', 'paid'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', '33333333-3333-3333-3333-333333333333',
    NULL, CURRENT_DATE + 3, '08:00:00', '09:00:00', 1.0, 80000, 'pending', 'unpaid'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM time_slots WHERE court_id = '22222222-2222-2222-2222-222222222222' AND date = CURRENT_DATE + 2 AND start_time = '19:00:00' LIMIT 1),
    CURRENT_DATE + 2, '19:00:00', '20:00:00', 1.0, 150000, 'cancelled', 'refunded');

-- Update booked slots for confirmed bookings
UPDATE time_slots SET status = 'booked' WHERE id IN (
  SELECT time_slot_id FROM bookings WHERE status = 'confirmed' AND time_slot_id IS NOT NULL
);

-- MEMBERSHIP TIERS
INSERT INTO membership_tiers (id, name, description, monthly_price, discount_percent, priority_booking_days, free_credits, perks) VALUES
  ('aaaa1111-bbbb-cccc-dddd-eeeeeeee0001', 'Basic', 'Cocok untuk pemain rekreasi', 99000, 5.0, 1, 2, ARRAY['Diskon 5% semua booking', '2 free credits/bulan', 'Akses info turnamen']),
  ('aaaa1111-bbbb-cccc-dddd-eeeeeeee0002', 'Pro', 'Untuk pemain serius yang ingin naik level', 199000, 10.0, 3, 5, ARRAY['Diskon 10% semua booking', '5 free credits/bulan', 'Prioritas booking 3 hari', '1 coaching session gratis/bulan', 'Akses turnamen eksklusif']),
  ('aaaa1111-bbbb-cccc-dddd-eeeeeeee0003', 'Elite', 'Pengalaman premium tanpa batas', 399000, 20.0, 7, 10, ARRAY['Diskon 20% semua booking', '10 free credits/bulan', 'Prioritas booking 7 hari', '3 coaching session gratis/bulan', 'Free merchandise', 'VIP lounge access', 'Akses semua turnamen']);

-- USER MEMBERSHIPS
INSERT INTO user_memberships (user_id, tier_id, status, payment_status, start_date, end_date, credits_remaining) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'aaaa1111-bbbb-cccc-dddd-eeeeeeee0002', 'active', 'paid', CURRENT_DATE - 15, CURRENT_DATE + 15, 3),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'aaaa1111-bbbb-cccc-dddd-eeeeeeee0001', 'active', 'paid', CURRENT_DATE - 5, CURRENT_DATE + 25, 1),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'aaaa1111-bbbb-cccc-dddd-eeeeeeee0003', 'active', 'paid', CURRENT_DATE - 20, CURRENT_DATE + 10, 7);

-- COACHES
INSERT INTO coaches (id, user_id, name, bio, specialties, certifications, hourly_rate, rating, total_reviews, is_active) VALUES
  ('cccc1111-2222-3333-4444-555555555551', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Rizky Pratama', 'Coach profesional dengan pengalaman 8 tahun di padel. Mantan pemain nasional.', ARRAY['Technique', 'Match Strategy', 'Beginner Training'], ARRAY['FIP Level 2', 'RPT Certified'], 150000, 4.80, 45, true),
  ('cccc1111-2222-3333-4444-555555555552', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Maya Sari', 'Spesialis coaching untuk pemula dan intermediate. Pendekatan yang fun dan structured.', ARRAY['Beginner Friendly', 'Fitness', 'Doubles Tactics'], ARRAY['FIP Level 1', 'ACE Coach'], 120000, 4.60, 32, true);

-- COACH BOOKINGS
INSERT INTO coach_bookings (coach_id, user_id, date, start_time, end_time, lesson_type, total_price, status, payment_status, participants_count, notes) VALUES
  ('cccc1111-2222-3333-4444-555555555551', 'd4e5f6a7-b8c9-0123-defa-234567890123', CURRENT_DATE + 2, '10:00:00', '11:00:00', 'private', 150000, 'confirmed', 'paid', 1, 'Fokus latihan backhand'),
  ('cccc1111-2222-3333-4444-555555555552', 'e5f6a7b8-c9d0-1234-efab-345678901234', CURRENT_DATE + 3, '14:00:00', '15:30:00', 'semi_private', 180000, 'pending', 'unpaid', 2, 'Latihan berdua dengan teman'),
  ('cccc1111-2222-3333-4444-555555555551', 'a7b8c9d0-e1f2-3456-abcd-567890123456', CURRENT_DATE + 4, '09:00:00', '10:00:00', 'private', 150000, 'confirmed', 'paid', 1, 'Match simulation');

-- TOURNAMENTS
INSERT INTO tournaments (id, name, description, format, level_min, level_max, entry_fee, max_participants, current_participants, prize_pool, tournament_date, registration_deadline, status, rules) VALUES
  ('dddd1111-2222-3333-4444-555555555551', 'Aero Padel Open 2026', 'Turnamen terbuka untuk semua level. Hadiah total Rp 5.000.000!', 'americano', 1.0, 7.0, 150000, 32, 12, 5000000, CURRENT_DATE + 14, CURRENT_DATE + 10, 'registering', 'Format americano. Best of 3 sets, tiebreak di set 3. Wajib membawa racquet sendiri.'),
  ('dddd1111-2222-3333-4444-555555555552', 'Ladies Night Tournament', 'Turnamen khusus wanita. Fun, friendly, dan kompetitif!', 'round_robin', 2.0, 5.0, 100000, 16, 8, 2000000, CURRENT_DATE + 21, CURRENT_DATE + 17, 'registering', 'Format round robin. Semua peserta dapat medali. Best of 3 sets.'),
  ('dddd1111-2222-3333-4444-555555555553', 'Junior Championship', 'Kejuaraan untuk pemain di bawah 18 tahun', 'single_elimination', 1.0, 4.0, 75000, 24, 0, 1500000, CURRENT_DATE + 30, CURRENT_DATE + 25, 'upcoming', 'Untuk pemain usia 12-18 tahun. Format single elimination. Best of 3 sets.');

-- TOURNAMENT REGISTRATIONS
INSERT INTO tournament_registrations (tournament_id, user_id, team_name, partner_name, partner_level, payment_status, status) VALUES
  ('dddd1111-2222-3333-4444-555555555551', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Team Farhan', 'Sari Dewi', 4.0, 'paid', 'confirmed'),
  ('dddd1111-2222-3333-4444-555555555551', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'Team Budi', 'Luna Putri', 5.0, 'paid', 'confirmed'),
  ('dddd1111-2222-3333-4444-555555555551', 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'Team Andi', 'Rina Sari', 3.0, 'paid', 'confirmed'),
  ('dddd1111-2222-3333-4444-555555555552', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'Dewi Sisters', 'Putri Lestari', 4.5, 'paid', 'confirmed'),
  ('dddd1111-2222-3333-4444-555555555552', 'a7b8c9d0-e1f2-3456-abcd-567890123456', 'Luna Squad', 'Maya Sari', 5.0, 'paid', 'confirmed');

-- SHOP CATEGORIES
INSERT INTO shop_categories (name, slug, icon, sort_order) VALUES
  ('Racquets', 'racquets', 'sports_tennis', 1),
  ('Balls', 'balls', 'circle', 2),
  ('Bags', 'bags', 'shopping_bag', 3),
  ('Apparel', 'apparel', 'checkroom', 4),
  ('Accessories', 'accessories', 'watch', 5);

-- SHOP PRODUCTS
INSERT INTO shop_products (category_id, name, description, price, discount_price, image_url, brand, stock, is_active) VALUES
  ((SELECT id FROM shop_categories WHERE slug = 'racquets'), 'Bullpadel Hack 02', 'Racquet performa tinggi untuk pemain agresif. Carbon frame.', 2500000, 2250000, '/images/racquet-1.jpg', 'Bullpadel', 15, true),
  ((SELECT id FROM shop_categories WHERE slug = 'racquets'), 'Head Alpha Motion', 'Ringan dan powerful. Cocok untuk semua level.', 3200000, NULL, '/images/racquet-2.jpg', 'Head', 10, true),
  ((SELECT id FROM shop_categories WHERE slug = 'racquets'), 'Nox MJ10 Luxury', 'Edisi luxury dengan desain elegan. Top control.', 4500000, 3990000, '/images/racquet-3.jpg', 'Nox', 8, true),
  ((SELECT id FROM shop_categories WHERE slug = 'balls'), 'Bullpadel Ball 3 Pack', 'Bola resmi turnamen. 3 pcs.', 85000, 75000, '/images/ball-1.jpg', 'Bullpadel', 50, true),
  ((SELECT id FROM shop_categories WHERE slug = 'balls'), 'Head Padel Ball 4 Pack', 'Bola tahan lama, bounce konsisten.', 110000, NULL, '/images/ball-2.jpg', 'Head', 40, true),
  ((SELECT id FROM shop_categories WHERE slug = 'bags'), 'Bullpadel Elite Bag', 'Tas besar untuk 2 racquet + aksesoris.', 450000, 399000, '/images/bag-1.jpg', 'Bullpadel', 20, true),
  ((SELECT id FROM shop_categories WHERE slug = 'apparel'), 'Aero Padel Jersey', 'Jersey resmi Aero Padel. Bahan dry-fit premium.', 275000, NULL, '/images/jersey-1.jpg', 'Aero Padel', 30, true),
  ((SELECT id FROM shop_categories WHERE slug = 'accessories'), 'Grip Overgrip 3 Pack', 'Grip anti-slip. 3 warna.', 45000, 35000, '/images/grip-1.jpg', 'Tourna', 100, true),
  ((SELECT id FROM shop_categories WHERE slug = 'accessories'), 'Padel Wristband', 'Headband & wristband set. Absorbent.', 65000, NULL, '/images/wristband-1.jpg', 'Bullpadel', 60, true);

-- SHOP ORDERS
INSERT INTO shop_orders (user_id, total_price, status, payment_status, shipping_address) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 2325000, 'delivered', 'paid', 'Jl. Sudirman No. 45, Jakarta Selatan'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 399000, 'shipped', 'paid', 'Jl. Thamrin No. 12, Jakarta Pusat'),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 4565000, 'processing', 'paid', 'Jl. Gatot Subroto No. 88, Jakarta Barat'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 75000, 'pending', 'unpaid', 'Jl. Rasuna Said No. 5, Jakarta Selatan');

-- SHOP ORDER ITEMS
INSERT INTO shop_order_items (order_id, product_id, quantity, unit_price) VALUES
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Sudirman%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Bullpadel Hack 02'), 1, 2250000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Sudirman%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Bullpadel Ball 3 Pack'), 1, 75000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Thamrin%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Nox MJ10 Luxury'), 1, 399000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Gatot Subroto%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Head Alpha Motion'), 1, 3200000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Gatot Subroto%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Aero Padel Jersey'), 2, 275000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Gatot Subroto%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Grip Overgrip 3 Pack'), 2, 35000),
  ((SELECT id FROM shop_orders WHERE shipping_address LIKE '%Rasuna Said%' LIMIT 1),
   (SELECT id FROM shop_products WHERE name = 'Bullpadel Ball 3 Pack'), 1, 75000);

-- VOUCHERS
INSERT INTO vouchers (code, description, discount_type, discount_value, min_purchase, max_uses, current_uses, valid_from, valid_until, is_active) VALUES
  ('WELCOME10', 'Diskon 10% untuk pengguna baru', 'percent', 10.00, 50000, 100, 23, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', true),
  ('PADEL25K', 'Diskon Rp 25.000 untuk booking', 'fixed', 25000, 100000, 50, 12, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', true),
  ('MEMBER15', 'Diskon 15% untuk member', 'percent', 15.00, 0, 200, 45, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', true),
  ('TOURNAMENT50', 'Diskon Rp 50.000 untuk turnamen', 'fixed', 50000, 150000, 30, 5, '2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', true),
  ('SUMMER20', 'Diskon musim panas 20%', 'percent', 20.00, 75000, 100, 0, '2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', true);
