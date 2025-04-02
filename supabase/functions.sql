

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

