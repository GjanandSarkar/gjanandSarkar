-- ============================================================
-- Gjanand Sarkar — SaaS Multi-Vendor Marketplace Migration
-- ============================================================

-- ─── 1. Sellers / Vendor Stores ──────────────────────────────
create table if not exists sellers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  store_name      text not null,
  slug            text unique not null,
  state           text not null,
  category        text not null default 'General',
  description     text,
  logo_url        text,
  banner_url      text,
  plan            text not null default 'growth', -- 'starter' (8%), 'growth' (5%), 'enterprise' (3%)
  commission_rate decimal(5,2) not null default 5.00,
  status          text not null default 'active', -- 'active', 'pending_kyc', 'suspended'
  gstin           text,
  pan             text,
  bank_account    text,
  ifsc_code       text,
  total_sales     decimal(12,2) not null default 0.00,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists sellers_user_id_idx on sellers(user_id);
create index if not exists sellers_state_idx on sellers(state);

-- ─── 2. Seller Payouts / Financials ──────────────────────────
create table if not exists seller_payouts (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references sellers(id) on delete cascade,
  amount       decimal(10,2) not null,
  fee_deducted decimal(10,2) not null,
  net_amount   decimal(10,2) not null,
  status       text not null default 'completed', -- 'pending', 'processing', 'completed'
  payout_date  timestamptz not null default now(),
  reference_no text
);

-- ─── 3. Customer Wishlists ───────────────────────────────────
create table if not exists wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists wishlists_user_id_idx on wishlists(user_id);

-- ─── 4. Product Reviews & Ratings ────────────────────────────
create table if not exists reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  user_id           uuid not null references profiles(id) on delete cascade,
  user_name         text not null,
  rating            integer not null check (rating >= 1 and rating <= 5),
  title             text,
  comment           text not null,
  state_origin      text,
  is_verified_buyer boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on reviews(product_id);

-- ─── 5. Alter Products with SaaS Marketplace Attributes ───────
alter table products add column if not exists seller_id uuid references sellers(id) on delete set null;
alter table products add column if not exists state_origin text default 'Gujarat';
alter table products add column if not exists brand text default 'Gjanand Farm';
alter table products add column if not exists rating decimal(3,2) default 4.80;
alter table products add column if not exists reviews_count integer default 128;
alter table products add column if not exists is_deal_of_the_day boolean default false;
alter table products add column if not exists discount_pct integer default 15;
alter table products add column if not exists tags text[] default array['Made in India', 'Authentic'];
