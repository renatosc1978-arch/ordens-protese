create table if not exists public.clients (
  id text primary key,
  name text not null,
  cro text,
  phone text,
  email text,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.patients (
  id text primary key,
  name text not null,
  client_id text references public.clients(id) on delete cascade,
  phone text,
  birth_date date,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id text primary key,
  client_id text references public.clients(id) on delete cascade,
  patient_id text references public.patients(id) on delete cascade,
  work_type text,
  status text,
  due_date date,
  reminder_days integer default 2,
  value numeric default 0,
  notes text,
  status_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.attachments (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  name text not null,
  type text,
  size bigint default 0,
  path text not null,
  uploaded_at timestamptz default now()
);

insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', false)
on conflict (id) do nothing;

alter table public.clients enable row level security;
alter table public.patients enable row level security;
alter table public.orders enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "anon select clients" on public.clients;
drop policy if exists "anon insert clients" on public.clients;
drop policy if exists "anon update clients" on public.clients;
drop policy if exists "anon delete clients" on public.clients;
create policy "anon select clients" on public.clients for select using (true);
create policy "anon insert clients" on public.clients for insert with check (true);
create policy "anon update clients" on public.clients for update using (true);
create policy "anon delete clients" on public.clients for delete using (true);

drop policy if exists "anon select patients" on public.patients;
drop policy if exists "anon insert patients" on public.patients;
drop policy if exists "anon update patients" on public.patients;
drop policy if exists "anon delete patients" on public.patients;
create policy "anon select patients" on public.patients for select using (true);
create policy "anon insert patients" on public.patients for insert with check (true);
create policy "anon update patients" on public.patients for update using (true);
create policy "anon delete patients" on public.patients for delete using (true);

drop policy if exists "anon select orders" on public.orders;
drop policy if exists "anon insert orders" on public.orders;
drop policy if exists "anon update orders" on public.orders;
drop policy if exists "anon delete orders" on public.orders;
create policy "anon select orders" on public.orders for select using (true);
create policy "anon insert orders" on public.orders for insert with check (true);
create policy "anon update orders" on public.orders for update using (true);
create policy "anon delete orders" on public.orders for delete using (true);

drop policy if exists "anon select attachments" on public.attachments;
drop policy if exists "anon insert attachments" on public.attachments;
drop policy if exists "anon update attachments" on public.attachments;
drop policy if exists "anon delete attachments" on public.attachments;
create policy "anon select attachments" on public.attachments for select using (true);
create policy "anon insert attachments" on public.attachments for insert with check (true);
create policy "anon update attachments" on public.attachments for update using (true);
create policy "anon delete attachments" on public.attachments for delete using (true);

drop policy if exists "anon read order files" on storage.objects;
drop policy if exists "anon insert order files" on storage.objects;
drop policy if exists "anon update order files" on storage.objects;
drop policy if exists "anon delete order files" on storage.objects;
create policy "anon read order files" on storage.objects for select using (bucket_id = 'order-files');
create policy "anon insert order files" on storage.objects for insert with check (bucket_id = 'order-files');
create policy "anon update order files" on storage.objects for update using (bucket_id = 'order-files');
create policy "anon delete order files" on storage.objects for delete using (bucket_id = 'order-files');

do $$
begin
  alter publication supabase_realtime add table public.clients;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.patients;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.attachments;
exception when duplicate_object then null;
end $$;
