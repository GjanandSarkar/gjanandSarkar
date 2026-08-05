-- ============================================================
-- Gjanand Sarkar — Seller Inquiries & Manual Verification Flow
-- ============================================================

create table if not exists seller_inquiries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete set null,
  full_name       text not null,
  business_name   text not null,
  phone           text not null,
  email           text not null,
  city            text,
  state           text not null default 'Gujarat',
  category        text not null default 'A2 Dairy & Ghee',
  product_range   text,
  monthly_volume  text,
  gstin           text,
  fssai_number    text,
  notes           text,
  status          text not null default 'pending', -- 'pending', 'contacted', 'approved', 'rejected'
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists seller_inquiries_status_idx on seller_inquiries(status);
create index if not exists seller_inquiries_phone_idx on seller_inquiries(phone);
create index if not exists seller_inquiries_created_at_idx on seller_inquiries(created_at desc);
