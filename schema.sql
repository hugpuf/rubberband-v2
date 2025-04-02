
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone TEXT DEFAULT 'UTC',
  subscription_plan TEXT DEFAULT 'free',
  country TEXT,
  logo_url TEXT,
  workspace_handle TEXT,
  referral_source TEXT
);

-- Create user_roles table to manage organization roles
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- Create organization_settings table for organization settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  primary_use_case TEXT,
  business_type TEXT,
  workflow_style TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create module_registry table for tracking enabled modules per organization
CREATE TABLE module_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_version TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, module_name)
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_registry ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user belongs to an organization
CREATE OR REPLACE FUNCTION user_belongs_to_organization(org_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin of an organization
CREATE OR REPLACE FUNCTION user_is_admin_of_organization(org_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND organization_id = org_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations table policies
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_belongs_to_organization(id));

CREATE POLICY organizations_insert ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (user_is_admin_of_organization(id));

-- User roles table policies
CREATE POLICY user_roles_select ON user_roles
  FOR SELECT USING (user_belongs_to_organization(organization_id));

CREATE POLICY user_roles_insert ON user_roles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY user_roles_update ON user_roles
  FOR UPDATE USING (user_is_admin_of_organization(organization_id));

CREATE POLICY user_roles_delete ON user_roles
  FOR DELETE USING (user_is_admin_of_organization(organization_id));

-- Settings table policies
CREATE POLICY settings_select ON organization_settings
  FOR SELECT USING (user_belongs_to_organization(organization_id));

CREATE POLICY settings_insert ON organization_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY settings_update ON organization_settings
  FOR UPDATE USING (user_is_admin_of_organization(organization_id));

-- Module registry table policies
CREATE POLICY module_registry_select ON module_registry
  FOR SELECT USING (user_belongs_to_organization(organization_id));

CREATE POLICY module_registry_insert ON module_registry
  FOR INSERT WITH CHECK (user_is_admin_of_organization(organization_id));

CREATE POLICY module_registry_update ON module_registry
  FOR UPDATE USING (user_is_admin_of_organization(organization_id));

CREATE POLICY module_registry_delete ON module_registry
  FOR DELETE USING (user_is_admin_of_organization(organization_id));

-- Create a trigger to automatically create settings row when an organization is created
CREATE OR REPLACE FUNCTION create_org_settings() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_settings (organization_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_org_settings
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_org_settings();

