
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
