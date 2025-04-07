
-- Function to get organization logs with proper security checks
CREATE OR REPLACE FUNCTION public.get_organization_logs(
  org_id_param UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  module TEXT,
  action TEXT, 
  timestamp TIMESTAMPTZ,
  metadata JSONB,
  profiles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is an admin of the organization
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND organization_id = org_id_param
    AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Only organization admins can view organization logs';
  END IF;
  
  RETURN QUERY
  SELECT 
    ul.id,
    ul.user_id,
    ul.module,
    ul.action,
    ul.timestamp,
    ul.metadata,
    jsonb_build_object(
      'full_name', p.full_name,
      'email', p.email
    ) as profiles
  FROM public.user_logs ul
  LEFT JOIN profiles p ON ul.user_id = p.id
  WHERE ul.organization_id = org_id_param
  ORDER BY ul.timestamp DESC
  LIMIT 200;
END;
$$;
