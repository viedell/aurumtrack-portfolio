
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Vaults (shared catalog)
CREATE TABLE public.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity_kg NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vaults TO authenticated;
GRANT ALL ON public.vaults TO service_role;
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users read vaults" ON public.vaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage vaults" ON public.vaults FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assets
CREATE TYPE public.asset_type AS ENUM ('gold', 'silver', 'platinum', 'palladium', 'diamond', 'other');
CREATE TYPE public.asset_status AS ENUM ('stored', 'in_transit', 'withdrawn', 'pending');
CREATE TYPE public.auth_status AS ENUM ('verified', 'pending', 'unverified');

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type public.asset_type NOT NULL,
  serial_number TEXT NOT NULL,
  weight_g NUMERIC(14,3) NOT NULL CHECK (weight_g > 0),
  purity NUMERIC(5,3),
  purchase_value NUMERIC(14,2) NOT NULL CHECK (purchase_value >= 0),
  current_value NUMERIC(14,2),
  photos TEXT[] DEFAULT '{}',
  status public.asset_status NOT NULL DEFAULT 'pending',
  authentication_status public.auth_status NOT NULL DEFAULT 'pending',
  vault_id UUID REFERENCES public.vaults(id) ON DELETE SET NULL,
  notes TEXT,
  acquired_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read assets" ON public.assets FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update assets" ON public.assets FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete assets" ON public.assets FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX assets_owner_idx ON public.assets(owner_id);
CREATE INDEX assets_vault_idx ON public.assets(vault_id);

-- Transactions / audit ledger (append-only)
CREATE TYPE public.txn_type AS ENUM ('registration', 'deposit', 'withdrawal', 'transfer', 'ownership_change', 'revaluation');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name TEXT,
  type public.txn_type NOT NULL,
  from_vault_id UUID REFERENCES public.vaults(id) ON DELETE SET NULL,
  to_vault_id UUID REFERENCES public.vaults(id) ON DELETE SET NULL,
  weight_g NUMERIC(14,3),
  value NUMERIC(14,2),
  notes TEXT,
  hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX txn_user_idx ON public.transactions(user_id, created_at DESC);

-- Alerts
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own + global alerts" ON public.alerts FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users resolve own alerts" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Price snapshots (market data)
CREATE TABLE public.price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal TEXT NOT NULL,
  price_usd_per_oz NUMERIC(14,2) NOT NULL,
  change_pct_24h NUMERIC(7,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.price_snapshots TO authenticated;
GRANT ALL ON public.price_snapshots TO service_role;
ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users read prices" ON public.price_snapshots FOR SELECT TO authenticated USING (true);
CREATE INDEX price_metal_idx ON public.price_snapshots(metal, recorded_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER assets_touch BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed vaults
INSERT INTO public.vaults (name, code, location, address, latitude, longitude, capacity_kg) VALUES
  ('Vault Alpha', 'VL-ALPHA', 'Zurich, Switzerland', 'Bahnhofstrasse 1, 8001 Zürich', 47.3769, 8.5417, 5000),
  ('Vault Beta', 'VL-BETA', 'Singapore', '1 Marina Boulevard, Singapore', 1.2839, 103.8607, 8000),
  ('Vault Gamma', 'VL-GAMMA', 'New York, USA', '11 Wall St, New York, NY', 40.7069, -74.0113, 6500);

-- Seed market prices
INSERT INTO public.price_snapshots (metal, price_usd_per_oz, change_pct_24h) VALUES
  ('gold', 2045.10, 0.80),
  ('silver', 24.50, -0.20),
  ('platinum', 910.20, 1.20),
  ('palladium', 1015.40, -0.45);
