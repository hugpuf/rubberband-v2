
import { supabase } from "@/integrations/supabase/client";
import { OnboardingState } from "./types";
import { User } from "@supabase/supabase-js";

export const fetchOnboardingData = async (
  user: User | null, 
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>
) => {
  if (!user) return;
  
  try {
    console.log("Fetching onboarding data for user:", user.id);
    
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, email')
      .eq('id', user.id);

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return;
    }

    if (profileData && profileData.length > 0) {
      console.log("Profile data found:", profileData[0]);
      setOnboarding(prev => ({
        ...prev,
        personalDetails: {
          firstName: profileData[0].first_name || '',
          lastName: profileData[0].last_name || '',
          avatarUrl: profileData[0].avatar_url
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

    // Get user's organization - don't use single() to avoid 406 errors
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error("Error fetching role data:", roleError);
      return;
    }

    if (!roleData || roleData.length === 0) {
      console.log("No organization role found for user");
      return;
    }
    
    console.log("User role found:", roleData[0]);
    
    if (roleData[0].organization_id) {
      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', roleData[0].organization_id);

      if (orgError) {
        console.error("Error fetching organization data:", orgError);
        return;
      }

      if (orgData && orgData.length > 0) {
        console.log("Organization data found:", orgData[0]);
        setOnboarding(prev => ({
          ...prev,
          organizationDetails: {
            name: orgData[0].name || '',
            workspaceHandle: orgData[0].workspace_handle || '',
            logoUrl: orgData[0].logo_url,
            country: orgData[0].country || '',
            referralSource: orgData[0].referral_source
          }
        }));
      }

      // Get organization settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', roleData[0].organization_id);

      if (settingsError) {
        console.error("Error fetching organization settings:", settingsError);
        return;
      }

      if (settingsData && settingsData.length > 0) {
        console.log("Organization settings found:", settingsData[0]);
        setOnboarding(prev => ({
          ...prev,
          useCaseDetails: {
            primaryUseCase: settingsData[0].primary_use_case,
            businessType: settingsData[0].business_type,
            workflowStyle: settingsData[0].workflow_style
          },
          isCompleted: !!settingsData[0].has_completed_onboarding
        }));
      } else {
        console.log("No organization settings found, creating default settings");
        // Create settings if they don't exist
        const { error: createSettingsError } = await supabase
          .from('organization_settings')
          .insert([
            {
              organization_id: roleData[0].organization_id,
              has_completed_onboarding: false
            },
          ]);
          
        if (createSettingsError) {
          console.error("Error creating organization settings:", createSettingsError);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
  }
};
