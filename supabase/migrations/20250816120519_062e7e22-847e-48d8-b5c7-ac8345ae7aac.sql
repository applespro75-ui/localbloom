-- Fix the user creation trigger to properly handle signup data
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.users (id, email, role, name)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add phone column to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update shops table to include phone and ensure proper structure
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add location columns to users for customer location tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS location_lng NUMERIC;