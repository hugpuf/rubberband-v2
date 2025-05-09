
-- Function to check if onboarding is completed
CREATE OR REPLACE FUNCTION public.check_onboarding_status(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_completed boolean;
BEGIN
  SELECT has_completed_onboarding INTO is_completed
  FROM organization_settings
  WHERE organization_id = org_id;
  
  RETURN COALESCE(is_completed, false);
END;
$$;

-- Function to update organization settings
CREATE OR REPLACE FUNCTION public.update_organization_settings(
  org_id uuid,
  primary_use_case_val text DEFAULT NULL,
  business_type_val text DEFAULT NULL,
  workflow_style_val text DEFAULT NULL,
  completed_onboarding boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organization_settings
  SET
    primary_use_case = COALESCE(primary_use_case_val, primary_use_case),
    business_type = COALESCE(business_type_val, business_type),
    workflow_style = COALESCE(workflow_style_val, workflow_style),
    has_completed_onboarding = COALESCE(completed_onboarding, has_completed_onboarding),
    updated_at = NOW()
  WHERE
    organization_id = org_id;
    
  -- Return if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization settings not found for ID: %', org_id;
  END IF;
END;
$$;

-- Function to create a user profile
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;
END;
$$;

-- Create the trigger for profile creation if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.create_profile_for_user();
  END IF;
END $$;

-- FIXED: Function to handle user deletion safely by UUID only
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  member_count INTEGER;
  profile_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Log the deletion request with clear UUID identification
  RAISE LOG 'Starting deletion process for user UUID: %', user_id_param;
  
  -- Verify the user exists in profiles and store email for logging only
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id_param), email 
  INTO profile_exists, user_email
  FROM profiles 
  WHERE id = user_id_param;
  
  IF NOT profile_exists THEN
    RAISE LOG 'User profile does not exist for UUID: %', user_id_param;
    RETURN false;
  END IF;
  
  RAISE LOG 'Found profile for user % with email % (email used for logging only)', user_id_param, user_email;
  
  -- Get the organization ID for this user
  SELECT organization_id INTO org_id
  FROM user_roles
  WHERE user_id = user_id_param
  LIMIT 1;
  
  IF org_id IS NULL THEN
    RAISE LOG 'User % does not belong to any organization', user_id_param;
    RETURN true;
  END IF;
  
  -- Count remaining members in the organization
  SELECT COUNT(*) INTO member_count
  FROM user_roles
  WHERE organization_id = org_id;
  
  RAISE LOG 'User % belongs to organization: %, with % members', user_id_param, org_id, member_count;
  
  -- If this is the last member, delete the entire organization
  IF member_count <= 1 THEN
    RAISE LOG 'Last member of organization detected, deleting organization: %', org_id;
    
    -- Delete the organization (will cascade to settings, etc.)
    DELETE FROM organizations WHERE id = org_id;
    RAISE LOG 'Organization % deleted', org_id;
  ELSE
    -- Just remove the user from the organization
    RAISE LOG 'Organization has % members, only removing user % from organization %', member_count, user_id_param, org_id;
    DELETE FROM user_roles WHERE user_id = user_id_param;
    RAISE LOG 'Removed user % from organization %', user_id_param, org_id;
  END IF;
  
  -- Delete the user profile
  -- This is now explicit rather than relying on cascade
  DELETE FROM profiles WHERE id = user_id_param;
  RAISE LOG 'Deleted profile for user %', user_id_param;
  
  RAISE LOG 'User deletion completed for UUID: %', user_id_param;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in delete_user_account: %', SQLERRM;
  RETURN false;
END;
$$;

-- Create a secure RPC function to delete the current user
CREATE OR REPLACE FUNCTION public.rpc_delete_current_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to delete themselves
  RETURN delete_user_account(auth.uid());
END;
$$;
