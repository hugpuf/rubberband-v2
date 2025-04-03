
-- Enable Row Level Security on teams table if not already enabled
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select teams from their own organization
CREATE POLICY IF NOT EXISTS "Users can view teams in their organization" 
ON public.teams
FOR SELECT
USING (user_belongs_to_organization(organization_id));

-- Create policy for users to insert teams in their own organization
CREATE POLICY IF NOT EXISTS "Users can create teams in their organization" 
ON public.teams
FOR INSERT
WITH CHECK (user_belongs_to_organization(organization_id));

-- Create policy for users to update teams in their own organization
CREATE POLICY IF NOT EXISTS "Users can update teams in their organization" 
ON public.teams
FOR UPDATE
USING (user_belongs_to_organization(organization_id) AND user_is_admin_of_organization(organization_id));

-- Create policy for users to delete teams in their own organization
CREATE POLICY IF NOT EXISTS "Users can delete teams in their organization" 
ON public.teams
FOR DELETE
USING (user_belongs_to_organization(organization_id) AND user_is_admin_of_organization(organization_id));

-- Enable Row Level Security on team_members table if not already enabled
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select team members from their organization's teams
CREATE POLICY IF NOT EXISTS "Users can view members of teams in their organization" 
ON public.team_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM teams t
  WHERE t.id = team_id AND user_belongs_to_organization(t.organization_id)
));

-- Create policy for admins to insert team members to teams in their organization
CREATE POLICY IF NOT EXISTS "Admins can add members to teams in their organization" 
ON public.team_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM teams t
  WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
));

-- Create policy for admins to update team members in their organization's teams
CREATE POLICY IF NOT EXISTS "Admins can update team members in their organization" 
ON public.team_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM teams t
  WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
));

-- Create policy for admins to delete team members from their organization's teams
CREATE POLICY IF NOT EXISTS "Admins can remove members from teams in their organization" 
ON public.team_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM teams t
  WHERE t.id = team_id AND user_is_admin_of_organization(t.organization_id)
));
