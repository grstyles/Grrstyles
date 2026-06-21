-- =========================================================================
-- GR STYLES - ROW LEVEL SECURITY (RLS) & ADMIN BOOTSTRAP
-- Copy and paste this script into the Supabase SQL Editor.
-- =========================================================================

-- 1. Ensure public.admins table exists (to satisfy trigger constraints)
create table if not exists public.admins (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Helper Function to Check Admin Role (Security Definer avoids recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 3. Re-create the User SignUp Trigger safely
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  
  if (new.raw_user_meta_data->>'role') = 'admin' then
    insert into public.admins (user_id) values (new.id) on conflict do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Bootstrap the existing Admin User
-- (Since sign-up was done before the trigger was fixed, we insert the profile manually)
insert into public.profiles (id, email, full_name, role)
values ('7ed46cd4-fad6-47c3-b0ff-0b42dd98990f', 'grstyles955@gmail.com', 'GR STYLES ADMIN', 'admin')
on conflict (id) do update set role = 'admin';

insert into public.admins (user_id)
values ('7ed46cd4-fad6-47c3-b0ff-0b42dd98990f')
on conflict do nothing;

-- 5. Profiles Table RLS
alter table public.profiles enable row level security;

drop policy if exists "Allow users to read own profile" on public.profiles;
create policy "Allow users to read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Allow users to update own profile" on public.profiles;
create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Allow users to insert own profile" on public.profiles;
create policy "Allow users to insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- 6. Products Table RLS
alter table public.products enable row level security;

drop policy if exists "Allow public read access for products" on public.products;
create policy "Allow public read access for products"
  on public.products for select
  using (true);

drop policy if exists "Allow admin write access for products" on public.products;
create policy "Allow admin write access for products"
  on public.products for all
  using (public.is_admin());

-- 7. Orders Table RLS
alter table public.orders enable row level security;

drop policy if exists "Allow users to read own orders" on public.orders;
create policy "Allow users to read own orders"
  on public.orders for select
  using (customer_email = (auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists "Allow anyone to insert orders" on public.orders;
create policy "Allow anyone to insert orders"
  on public.orders for insert
  with check (true);

drop policy if exists "Allow admin to update or delete orders" on public.orders;
create policy "Allow admin to update or delete orders"
  on public.orders for all
  using (public.is_admin());

-- 8. Coupons Table RLS
alter table public.coupons enable row level security;

drop policy if exists "Allow public read access for coupons" on public.coupons;
create policy "Allow public read access for coupons"
  on public.coupons for select
  using (true);

drop policy if exists "Allow admin write access for coupons" on public.coupons;
create policy "Allow admin write access for coupons"
  on public.coupons for all
  using (public.is_admin());

-- 9. Categories Table RLS
alter table public.categories enable row level security;

drop policy if exists "Allow public read access for categories" on public.categories;
create policy "Allow public read access for categories"
  on public.categories for select
  using (true);

drop policy if exists "Allow admin write access for categories" on public.categories;
create policy "Allow admin write access for categories"
  on public.categories for all
  using (public.is_admin());

-- 10. Collections Table RLS
alter table public.collections enable row level security;

drop policy if exists "Allow public read access for collections" on public.collections;
create policy "Allow public read access for collections"
  on public.collections for select
  using (true);

drop policy if exists "Allow admin write access for collections" on public.collections;
create policy "Allow admin write access for collections"
  on public.collections for all
  using (public.is_admin());
