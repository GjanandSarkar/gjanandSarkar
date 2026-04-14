-- ============================================================
-- DairyDirect — Supabase Schema (Complete & Fixed)
-- Run this once in the Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- ─── Clean Up Existing (for safe recreation) ─────────────────
drop schema public cascade;
create schema public;

-- Grant permissions explicitly
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ─── Enums ───────────────────────────────────────────────────
create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending','confirmed','out_for_delivery','delivered','cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type subscription_status as enum ('active','paused','cancelled','pending_review');

-- ─── profiles ────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique,
  email       text unique,
  name        text,
  avatar_url  text,
  role        user_role not null default 'customer',
  default_upi_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_phone_idx on profiles(phone);

-- ─── user_addresses ──────────────────────────────────────────
create table user_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  label      text not null default 'Home',
  address    text not null,
  lat        float,
  lng        float,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── products ────────────────────────────────────────────────
create table products (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  category               text not null,
  description            text,
  image_url              text,
  is_freshness_guarantee boolean not null default false,
  is_active              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── product_variants ────────────────────────────────────────
create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  weight         text not null, -- e.g. "500ml", "1kg"
  price          decimal(10,2) not null,
  original_price decimal(10,2),
  cost_price     decimal(10,2) not null default 0,
  stock          integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ─── cart_items ──────────────────────────────────────────────
create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity   integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, variant_id)
);

-- ─── subscriptions ───────────────────────────────────────────
create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  product_id         uuid not null references products(id),
  variant_id         uuid not null references product_variants(id),
  volume             integer not null default 1,     -- quantity per delivery
  plan               text not null default 'Daily',  -- e.g. 'Daily', 'Alternate Days'
  status             subscription_status not null default 'active',
  start_date         timestamptz not null default now(),
  next_delivery_date timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── modification_reports ────────────────────────────────────
create table modification_reports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  action          text not null, -- e.g. "Paused", "Resume", "Update"
  new_volume      integer,
  new_plan        text,
  created_at      timestamptz not null default now()
);

-- ─── orders ──────────────────────────────────────────────────
create table orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  address_id      uuid references user_addresses(id),
  status          order_status not null default 'pending',
  total_amount    decimal(10,2) not null,
  payment_method  text not null default 'COD',
  payment_status  payment_status not null default 'pending',
  payment_details jsonb,
  notes           text,
  delivery_date   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── order_items ─────────────────────────────────────────────
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references product_variants(id),
  quantity   integer not null,
  price      decimal(10,2) not null,
  created_at timestamptz not null default now()
);

-- ─── notifications ───────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade, -- Nullable for broadcast
  role_target text not null default 'customer',
  title       text not null,
  message     text not null,
  type        text not null default 'info',
  related_id  text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── translations ────────────────────────────────────────────
create table translations (
  language      text not null,
  key           text not null,
  value         text not null,
  primary key (language, key)
);

-- ─── business_settings ──────────────────────────────────────
create table business_settings (
  id                         uuid primary key default gen_random_uuid(),
  min_profit_margin_percent  decimal(10,2) not null default 20.0,
  free_delivery_threshold    decimal(10,2) not null default 299.0,
  delivery_cost              decimal(10,2) not null default 25.0,
  max_discount_percent       decimal(10,2) not null default 30.0,
  updated_at                 timestamptz not null default now()
);

-- ─── coupons ───────────────────────────────────────────────
create table coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  type             text not null, -- 'flat' or 'percentage'
  value            decimal(10,2) not null,
  min_order_value  decimal(10,2) not null default 0,
  max_discount     decimal(10,2),
  is_active        boolean not null default true,
  expiry_date      timestamptz,
  created_at       timestamptz not null default now()
);

-- ─── Auto-update updated_at Trigger ──────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger user_addresses_updated_at before update on user_addresses for each row execute function update_updated_at();
create trigger products_updated_at before update on products for each row execute function update_updated_at();
create trigger cart_items_updated_at before update on cart_items for each row execute function update_updated_at();
create trigger subscriptions_updated_at before update on subscriptions for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders for each row execute function update_updated_at();
create trigger business_settings_updated_at before update on business_settings for each row execute function update_updated_at();

-- ─── Row Level Security (RLS) ────────────────────────────────
-- Enable RLS
alter table profiles enable row level security;
alter table user_addresses enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table cart_items enable row level security;
alter table subscriptions enable row level security;
alter table modification_reports enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;
alter table translations enable row level security;
alter table business_settings enable row level security;
alter table coupons enable row level security;

-- Policies for Authenticated Users 
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

create policy "Users can manage their own addresses" on user_addresses for all using (auth.uid() = user_id);
create policy "Users can manage their own cart" on cart_items for all using (auth.uid() = user_id);
create policy "Users can view their own subscriptions" on subscriptions for select using (auth.uid() = user_id);
create policy "Users can view their own modification reports" on modification_reports for select using (auth.uid() = user_id);
create policy "Users can view their own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can view their own order items" on order_items for select using (auth.uid() in (select user_id from orders where id = order_items.order_id));
create policy "Users can view and update their notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update their notifications" on notifications for update using (auth.uid() = user_id);
create policy "Users can insert their own notifications" on notifications for insert with check (auth.uid() = user_id or user_id is null);

-- Insert policies for orders
create policy "Users can insert their own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Users can insert their own order items" on order_items for insert with check (
  exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
);

-- Policies for Public/Anon (Read Only)
create policy "Anyone can view products" on products for select using (true);
create policy "Anyone can view variants" on product_variants for select using (true);
create policy "Anyone can view translations" on translations for select using (true);
create policy "Anyone can view settings" on business_settings for select using (true);
create policy "Anyone can view coupons" on coupons for select using (true);

-- ─── Safety Constraints ──────────────────────────────────────
ALTER TABLE coupons ADD CONSTRAINT coupon_type_check CHECK (type IN ('flat', 'percentage'));
ALTER TABLE product_variants ADD CONSTRAINT profit_check CHECK (price >= cost_price);

-- ─── Performance Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);
