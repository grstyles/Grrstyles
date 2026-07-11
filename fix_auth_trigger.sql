-- =============================================================================
-- GR STYLES – Auth Trigger Duplicate-Key Fix
-- =============================================================================
-- PROBLEM: The original handle_new_user() trigger used a bare INSERT with no
-- ON CONFLICT clause. When a returning Google user signed in (or Supabase fired
-- the trigger on token refresh / identity re-link), the INSERT threw:
--   ERROR 23505: duplicate key value violates unique constraint "profiles_pkey"
-- This aborted the entire sign-in operation, preventing existing users from
-- ever logging in again.
--
-- FIX: Replace the bare INSERT with INSERT … ON CONFLICT (id) DO UPDATE so the
-- trigger is idempotent. Re-running it for an existing user simply refreshes the
-- email and full_name but never creates a duplicate row.
-- =============================================================================

-- Step 1: Replace the trigger function with an idempotent UPSERT version
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Use ON CONFLICT DO UPDATE so this is safe to run for any user — new or
  -- returning. A bare INSERT would throw a duplicate-key error (23505) if
  -- Supabase fires this trigger again for an existing user.
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update
    set
      email     = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- Grant admin table entry when the role metadata is 'admin'
  if (new.raw_user_meta_data->>'role') = 'admin' then
    insert into public.admins (user_id)
    values (new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Step 2: Re-attach the trigger (drop first to avoid duplicate)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Step 3: Add a safe application-level helper function
-- This can be called from the app as a fallback if a profile row is ever missing
-- for an already-authenticated user (edge case: row deleted manually, etc.).
create or replace function public.safe_ensure_profile(
  p_id        uuid,
  p_email     text,
  p_full_name text,
  p_role      text default 'customer'
)
returns void as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (p_id, p_email, p_full_name, p_role)
  on conflict (id) do update
    set
      email     = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
end;
$$ language plpgsql security definer;

-- Step 4: Repair any existing auth.users rows that have no profiles row
-- (These are accounts created before the trigger existed or after a manual delete)
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'customer')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- Done. Verify with:
-- select count(*) from auth.users;
-- select count(*) from public.profiles;
-- Both counts should match (or profiles >= users if manual rows exist).
