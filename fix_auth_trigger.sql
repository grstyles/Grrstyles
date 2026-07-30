-- =============================================================================
-- GR STYLES – Complete Auth Trigger & Profile Repair SQL Migration
-- =============================================================================
-- ROOT CAUSE FIX:
-- 1. Dropped corrupted handle_duplicate_email_trigger on public.profiles which
--    attempted to update a non-existent column 'updated_at' and modify primary key 'id'.
-- 2. Cleaned up stale orphaned profile rows that held duplicate emails.
-- 3. Created idempotent handle_new_user() trigger with ON CONFLICT (id) DO UPDATE.
-- 4. Automatically inserts into public.admins when user metadata role is 'admin'.
-- 5. Repaired all auth.users rows to guarantee matching public.profiles rows.
-- =============================================================================

-- Step 1: Drop broken trigger and function on public.profiles
DROP TRIGGER IF EXISTS handle_duplicate_email_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_duplicate_email();

-- Step 2: Delete stale/orphaned profiles where ID is not in auth.users
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 3: Create or replace handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(COALESCE(NEW.email, 'User'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);

  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    INSERT INTO public.admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Sync all auth.users rows into public.profiles
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(u.email, 'User'), '@', 1)
  ),
  COALESCE(u.raw_user_meta_data->>'role', 'customer'),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);

-- Step 6: Ensure admin table entries for any users with role='admin'
INSERT INTO public.admins (user_id)
SELECT id FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;
