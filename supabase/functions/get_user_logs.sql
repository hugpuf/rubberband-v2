
-- Function to get user logs by user ID
CREATE OR REPLACE FUNCTION public.get_user_logs(user_id_param UUID)
RETURNS SETOF public.user_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is requesting their own logs
  IF auth.uid() <> user_id_param THEN
    RAISE EXCEPTION 'Users can only view their own logs';
  END IF;
  
  RETURN QUERY
  SELECT *
  FROM public.user_logs
  WHERE user_id = user_id_param
  ORDER BY timestamp DESC
  LIMIT 100;
END;
$$;
