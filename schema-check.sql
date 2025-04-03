
-- Check if RLS is enabled for teams table
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'teams';

-- Create RLS policies for teams table if needed
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy for viewing teams in your organization
CREATE POLICY IF NOT EXISTS "Users can view teams in their organization" 
  ON public.teams 
  FOR SELECT 
  USING (user_belongs_to_organization(organization_id));

-- Policy for inserting teams in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can create teams in their organization" 
  ON public.teams 
  FOR INSERT 
  WITH CHECK (user_is_admin_of_organization(organization_id));

-- Policy for updating teams in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can update teams in their organization" 
  ON public.teams 
  FOR UPDATE 
  USING (user_is_admin_of_organization(organization_id));

-- Policy for deleting teams in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can delete teams in their organization" 
  ON public.teams 
  FOR DELETE 
  USING (user_is_admin_of_organization(organization_id));

-- Check if RLS is enabled for team_members table
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'team_members';

-- Enable RLS for team_members table if needed
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy for viewing team members in your organization
CREATE POLICY IF NOT EXISTS "Users can view team members in their organization" 
  ON public.team_members 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_id AND user_belongs_to_organization(t.organization_id)
  ));

-- Policy for inserting team members in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can add members to teams in their organization" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
  ));

-- Policy for updating team members in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can update team members in their organization" 
  ON public.team_members 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
  ));

-- Policy for deleting team members in your organization (admins only)
CREATE POLICY IF NOT EXISTS "Admins can remove members from teams in their organization" 
  ON public.team_members 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
  ));
