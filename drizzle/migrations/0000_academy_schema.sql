create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  village text not null,
  age_group text not null,
  current_status text not null,
  device_access text not null,
  experience text not null,
  interests text[] not null default '{}',
  main_goal text not null,
  practice_time text not null,
  consent boolean not null default false,
  consent_at timestamptz,
  guardian_name text,
  guardian_phone text,
  guardian_consent boolean not null default false,
  recommended_tier text not null,
  selected_tier text,
  wants_advice boolean not null default false,
  payment_status text not null default 'pending',
  payment_amount integer not null default 14900,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  payment_verified_via text,
  paid_at timestamptz,
  lead_status text not null default 'new',
  notes text,
  access_token_hash text not null,
  ip_hash text
);
grant select, update on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "Admins read applications" on public.applications for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update applications" on public.applications for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create index on public.applications (created_at desc);
create index on public.applications (ip_hash, created_at);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  order_id text,
  payment_id text,
  received_at timestamptz not null default now()
);
grant all on public.payment_events to service_role;
alter table public.payment_events enable row level security;