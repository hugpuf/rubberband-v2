
-- This file contains SQL fixes for the foreign key relationship issues
-- You can run this in your Supabase SQL editor

-- Check if there's a foreign key relationship between user_roles and profiles
-- that might be causing the PGRST200 error
DO $$
BEGIN
  -- Check if there's an incorrect foreign key constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%user_roles%profiles%'
    OR conname LIKE '%profiles%user_roles%'
  ) THEN
    -- If found, drop it (you'd need to specify the exact constraint name)
    -- Example: EXECUTE 'ALTER TABLE user_roles DROP CONSTRAINT constraint_name';
    RAISE NOTICE 'Foreign key constraint found that might need to be dropped';
  ELSE
    RAISE NOTICE 'No problematic foreign key constraint found between user_roles and profiles';
  END IF;
END $$;

-- Make sure user_roles references auth.users correctly
ALTER TABLE IF EXISTS public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure profiles references auth.users correctly
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure there's no unintended relationship between profiles and user_roles
-- This would be unnecessary and could cause circular reference issues
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_profiles_fk'
    OR conname LIKE '%user_roles%profiles%fkey%'
  ) THEN
    -- Drop any incorrect foreign key
    RAISE NOTICE 'Would drop incorrect foreign key between user_roles and profiles here';
  END IF;
END $$;

-- Double-check RLS policies to make sure they're sensible
-- Organizations table should be accessible by authenticated users for INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND operation = 'INSERT'
    AND permissive = true
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone authenticated can create organizations" ON organizations FOR INSERT TO authenticated WITH CHECK (true)';
    RAISE NOTICE 'Created permissive INSERT policy for organizations';
  ELSE
    RAISE NOTICE 'INSERT policy for organizations already exists';
  END IF;
END $$;
