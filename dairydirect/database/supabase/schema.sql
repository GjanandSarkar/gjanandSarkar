-- ============================================================
-- DairyDirect — Supabase Schema
-- Run this once in the Supabase SQL Editor (Database → SQL Editor)
-- Replaces prisma/schema.prisma
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────
create type role as enum ('CUSTOMER', 'ADMIN');
create type order_status as enum ('PENDING','CONFIRMED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
create type order_type as enum ('SINGLE','SUBSCRIPTION');
create type subscription_frequency as enum ('DAILY','WEEKLY','MONTHLY');
create type subscription_status as enum ('ACTIVE','PAUSED','CANCELLED','EXPIRED');
create type product_category as enum ('MILK','PANEER','GHEE','BUTTERMILK');
create type report_status as enum ('OPEN','IN_REVIEW','RESOLVED','DISMISSED');
create type issue_type as enum ('SPOILED','WRONG_QUANTITY','WRONG_PRODUCT','LATE_DELIVERY','OTHER');

-- ─── users ───────────────────────────────────────────────────
create table users (
  id          text primary key default gen_random_uuid()::text,
  phone       text unique not null,
  supabase_id text unique,
  name        text,
  role        role not null default 'CUSTOMER',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index users_phone_idx       on users(phone);
create index users_supabase_id_idx on users(supabase_id);

-- ─── addresses ───────────────────────────────────────────────
create table addresses (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  label      text not null default 'Home',
  street     text not null,
  area       text not null,
  city       text not null default 'Ahmedabad',
  pincode    text not null,
  lat        float,
  lng        float,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_id_idx on addresses(user_id);

-- ─── products ────────────────────────────────────────────────
create table products (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  category    product_category not null,
  description text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_category_idx  on products(category);
create index products_is_active_idx on products(is_active);

-- ─── product_variants ────────────────────────────────────────
create table product_variants (
  id         text primary key default gen_random_uuid()::text,
  product_id text not null references products(id) on delete cascade,
  label      text not null,
  price      decimal(10,2) not null,
  stock      integer not null default 0,
  is_active  boolean not null default true
);
create index product_variants_product_id_idx on product_variants(product_id);

-- ─── subscriptions ───────────────────────────────────────────
create table subscriptions (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id),
  variant_id text not null references product_variants(id),
  quantity   integer not null default 1,
  frequency  subscription_frequency not null default 'DAILY',
  start_date timestamptz not null,
  end_date   timestamptz,
  status     subscription_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on subscriptions(user_id);
create index subscriptions_status_idx  on subscriptions(status);

-- ─── orders ──────────────────────────────────────────────────
create table orders (
  id              text primary key default gen_random_uuid()::text,
  user_id         text not null references users(id),
  address_id      text not null references addresses(id),
  subscription_id text references subscriptions(id),
  type            order_type not null,
  status          order_status not null default 'PENDING',
  total_amount    decimal(10,2) not null,
  payment_mode    text not null default 'MOCK',
  payment_status  text not null default 'PENDING',
  delivery_otp    text,
  delivery_lat    float,
  delivery_lng    float,
  delivered_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_user_id_idx         on orders(user_id);
create index orders_status_idx          on orders(status);
create index orders_subscription_id_idx on orders(subscription_id);
create index orders_created_at_idx      on orders(created_at);

-- ─── order_items ─────────────────────────────────────────────
create table order_items (
  id         text primary key default gen_random_uuid()::text,
  order_id   text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  variant_id text not null references product_variants(id),
  quantity   integer not null,
  unit_price decimal(10,2) not null,
  subtotal   decimal(10,2) not null
);
create index order_items_order_id_idx on order_items(order_id);

-- ─── quality_reports ─────────────────────────────────────────
create table quality_reports (
  id          text primary key default gen_random_uuid()::text,
  order_id    text unique not null references orders(id),
  user_id     text not null references users(id),
  issue_type  issue_type not null,
  description text not null,
  image_url   text,
  status      report_status not null default 'OPEN',
  resolution  text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index quality_reports_status_idx  on quality_reports(status);
create index quality_reports_user_id_idx on quality_reports(user_id);

-- ─── Auto-update updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at          before update on users          for each row execute function update_updated_at();
create trigger products_updated_at       before update on products       for each row execute function update_updated_at();
create trigger orders_updated_at         before update on orders         for each row execute function update_updated_at();
create trigger subscriptions_updated_at  before update on subscriptions  for each row execute function update_updated_at();
create trigger quality_reports_updated_at before update on quality_reports for each row execute function update_updated_at();

-- ─── Row Level Security (optional for trial — disable to keep it simple) ─────
-- alter table users           enable row level security;
-- alter table addresses       enable row level security;
-- alter table products        enable row level security;
-- alter table product_variants enable row level security;
-- alter table subscriptions   enable row level security;
-- alter table orders          enable row level security;
-- alter table order_items     enable row level security;
-- alter table quality_reports enable row level security;
