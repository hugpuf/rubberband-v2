
import { supabase } from "@/integrations/supabase/client";
import { OnboardingState } from "./types";
import { User } from "@supabase/supabase-js";

export const fetchOnboardingData = async (
  user: User | null, 
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>
) => {
  if (!user) {
    console.error("Cannot fetch onboarding data: No user provided");
    return;
  }
  
  try {
    console.log("Fetching onboarding data for user:", user.id);
    
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return;
    }

    if (profileData) {
      console.log("Profile data found");
      setOnboarding(prev => ({
        ...prev,
        personalDetails: {
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          avatarUrl: profileData.avatar_url
        }
      }));
    } else {
      console.log("No profile data found, creating one");
      // Create profile if it doesn't exist
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email || ''
          },
        ]);
        
      if (createProfileError) {
        console.error("Error creating profile:", createProfileError);
      }
    }

    // Get user's organization
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error("Error fetching role data:", roleError);
      return;
    }

    if (!roleData || !roleData.organization_id) {
      console.log("No organization role found for user, creating default organization");
      
      // Create a new organization for the user if none exists
      const { data: newOrg, error: orgCreateError } = await supabase
        .from('organizations')
        .insert([
          {
            name: user.email?.split('@')[0] || 'My Organization',
            workspace_handle: `org-${Date.now().toString().substring(7)}`,
            created_by: user.id
          }
        ])
        .select()
        .single();
        
      if (orgCreateError) {
        console.error("Error creating organization:", orgCreateError);
        return;
      }
      
      if (newOrg) {
        // Assign user as admin in the new organization
        const { error: roleCreateError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: user.id,
              organization_id: newOrg.id,
              role: 'admin'
            }
          ]);
          
        if (roleCreateError) {
          console.error("Error creating user role:", roleCreateError);
          return;
        }
        
        // Create organization settings
        const { error: settingsCreateError } = await supabase
          .from('organization_settings')
          .insert([
            {
              organization_id: newOrg.id,
              has_completed_onboarding: false
            }
          ]);
          
        if (settingsCreateError) {
          console.error("Error creating organization settings:", settingsCreateError);
        }
        
        // Update the onboarding state with the new organization
        setOnboarding(prev => ({
          ...prev,
          organizationDetails: {
            name: newOrg.name || '',
            workspaceHandle: newOrg.workspace_handle || '',
            logoUrl: null,
            country: '',
            referralSource: null
          }
        }));
        
        return;
      }
      
      return;
    }
    
    // Get organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', roleData.organization_id)
      .maybeSingle();

    if (orgError) {
      console.error("Error fetching organization data:", orgError);
      return;
    }

    if (orgData) {
      console.log("Organization data found");
      setOnboarding(prev => ({
        ...prev,
        organizationDetails: {
          name: orgData.name || '',
          workspaceHandle: orgData.workspace_handle || '',
          logoUrl: orgData.logo_url,
          country: orgData.country || '',
          referralSource: orgData.referral_source
        }
      }));
    }

    // Get organization settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', roleData.organization_id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching organization settings:", settingsError);
      return;
    }

    if (settingsData) {
      console.log("Organization settings found:", settingsData);
      setOnboarding(prev => ({
        ...prev,
        useCaseDetails: {
          primaryUseCase: settingsData.primary_use_case,
          businessType: settingsData.business_type,
          workflowStyle: settingsData.workflow_style
        },
        isCompleted: !!settingsData.has_completed_onboarding
      }));
    } else {
      console.log("No organization settings found, creating default settings");
      // Create settings if they don't exist
      const { error: createSettingsError } = await supabase
        .from('organization_settings')
        .insert([
          {
            organization_id: roleData.organization_id,
            has_completed_onboarding: false
          },
        ]);
        
      if (createSettingsError) {
        console.error("Error creating organization settings:", createSettingsError);
      }
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
  }
};
