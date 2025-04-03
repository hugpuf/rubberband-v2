
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

-- Make sure organization_settings references organizations correctly with cascade delete
ALTER TABLE IF EXISTS public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_organization_id_fkey,
  ADD CONSTRAINT organization_settings_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id) ON DELETE CASCADE;

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

-- Add a database function to handle account deletion cleanly
CREATE OR REPLACE FUNCTION public.delete_user_cascade(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  member_count INTEGER;
BEGIN
  -- Log the deletion request
  RAISE LOG 'Starting deletion process for user: %', user_id_param;
  
  -- Get the organization ID for this user
  SELECT organization_id INTO org_id
  FROM user_roles
  WHERE user_id = user_id_param
  LIMIT 1;
  
  IF org_id IS NOT NULL THEN
    -- Count remaining members in the organization
    SELECT COUNT(*) INTO member_count
    FROM user_roles
    WHERE organization_id = org_id;
    
    RAISE LOG 'User belongs to organization: %, with % members', org_id, member_count;
    
    -- If this is the last member, delete the entire organization
    IF member_count <= 1 THEN
      RAISE LOG 'Last member of organization detected, deleting organization: %', org_id;
      
      -- Delete the organization (will cascade to settings, etc.)
      DELETE FROM organizations WHERE id = org_id;
    END IF;
  END IF;
  
  -- Delete user-specific data
  DELETE FROM user_roles WHERE user_id = user_id_param;
  -- Profiles should be deleted by the auth.users cascade delete
  
  RAISE LOG 'User deletion completed for: %', user_id_param;
END;
$$;

-- Create a secure RPC endpoint for the delete function
DROP FUNCTION IF EXISTS public.rpc_delete_current_user();
CREATE OR REPLACE FUNCTION public.rpc_delete_current_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to delete themselves
  PERFORM delete_user_cascade(auth.uid());
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in rpc_delete_current_user: %', SQLERRM;
  RETURN false;
END;
$$;

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

-- Ensure profiles has delete policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND operation = 'DELETE'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own profiles" ON profiles FOR DELETE USING (auth.uid() = id)';
    RAISE NOTICE 'Created DELETE policy for profiles';
  ELSE
    RAISE NOTICE 'DELETE policy for profiles already exists';
  END IF;
END $$;
