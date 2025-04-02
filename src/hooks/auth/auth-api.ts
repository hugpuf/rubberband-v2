
import { supabase } from "@/integrations/supabase/client";

export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log("Checking onboarding status for user:", userId);
    
    // Get user's organization
    const { data: orgData, error: orgError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId);
      
    if (orgError) {
      console.error("Error getting organization:", orgError);
      return false;
    }
    
    if (!orgData || orgData.length === 0) {
      console.log("No organization found for user");
      return false;
    }
    
    console.log("Found organization for user:", orgData[0].organization_id);
    
    // Check if onboarding is completed
    const { data: settingsData, error: settingsError } = await supabase
      .from('organization_settings')
      .select('has_completed_onboarding')
      .eq('organization_id', orgData[0].organization_id)
      .single();
    
    if (settingsError) {
      console.error("Error checking onboarding status:", settingsError);
      return false;
    }
    
    console.log("Onboarding status:", settingsData?.has_completed_onboarding);
    return !!settingsData?.has_completed_onboarding;
  } catch (error) {
    console.error("Error in checkOnboardingStatus:", error);
    return false;
  }
};

export const createUserAccount = async (email: string, password: string) => {
  console.log("STEP 1: Creating user account");
  console.log("Signup data being sent:", { email });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("User creation error:", error.message, error);
    console.error("Request data that failed:", { email });
    throw error;
  }

  if (!data.user) {
    const errorMsg = "User account creation failed - no user returned from auth";
    console.error(errorMsg);
    console.error("Request data that failed:", { email });
    throw new Error(errorMsg);
  }
  
  return data.user;
};

export const createOrganization = async (orgName: string) => {
  console.log("STEP 2: Creating organization:", orgName);
  console.log("Organization data being sent:", { name: orgName });
  
  const { data, error } = await supabase
    .from('organizations')
    .insert([{ name: orgName }])
    .select();

  if (error) {
    console.error("Error creating organization:", error.message, error);
    console.error("Organization data attempted:", { name: orgName });
    throw error;
  }

  if (!data || data.length === 0) {
    const errorMsg = "Failed to create organization - no data returned";
    console.error(errorMsg);
    console.error("Organization data attempted:", { name: orgName });
    throw new Error(errorMsg);
  }
  
  return data[0].id;
};

export const createUserRole = async (userId: string, orgId: string, role: string = "admin") => {
  console.log("STEP 3: Creating user role for user", userId, "in organization", orgId);
  console.log("Role data being sent:", {
    user_id: userId,
    organization_id: orgId,
    role,
  });
  
  const { error } = await supabase
    .from('user_roles')
    .insert([
      {
        user_id: userId,
        organization_id: orgId,
        role,
      },
    ]);

  if (error) {
    console.error("Error creating user role:", error.message, error);
    console.error("Role data attempted:", {
      user_id: userId,
      organization_id: orgId,
      role,
    });
    console.error("Transaction context:", { organizationCreated: true });
    throw error;
  }
  
  return true;
};

export const verifyUserProfile = async (userId: string, email: string) => {
  console.log("STEP 4: Verifying user profile exists");
  console.log("Profile check data:", { id: userId });
  
  const { data, error: profileCheckError } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId);
    
  if (profileCheckError) {
    console.error("Error checking profile:", profileCheckError.message, profileCheckError);
    console.error("Profile check data:", { id: userId });
  }
  
  if (!data || data.length === 0) {
    console.log("Profile not found, creating manually");
    console.log("Profile data being sent:", {
      id: userId,
      email: email
    });
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: email
        },
      ]);
      
    if (profileError) {
      console.error("Error creating profile:", profileError.message, profileError);
      console.error("Profile data attempted:", {
        id: userId,
        email: email
      });
      console.error("Transaction context:", { organizationCreated: true, roleCreated: true });
      throw profileError;
    }
    
    console.log("Profile created manually");
  } else {
    console.log("Profile already exists");
  }
  
  return true;
};

export const createOrganizationSettings = async (orgId: string) => {
  console.log("STEP 5: Creating organization settings");
  console.log("Organization settings data being sent:", {
    organization_id: orgId,
    has_completed_onboarding: false
  });
  
  const { error } = await supabase
    .from('organization_settings')
    .insert([{
      organization_id: orgId,
      has_completed_onboarding: false
    }]);
    
  if (error) {
    console.error("Error creating organization settings:", error.message, error);
    console.error("Settings data attempted:", {
      organization_id: orgId,
      has_completed_onboarding: false
    });
    console.error("Transaction context:", { 
      organizationCreated: true, 
      roleCreated: true,
      profileCreated: true 
    });
    throw error;
  }
  
  console.log("Organization settings created successfully");
  return true;
};

export const getAuthSession = async () => {
  try {
    console.log("Checking for active session");
    const { data } = await supabase.auth.getSession();
    
    if (data.session?.user) {
      console.log("Active session found, user ID:", data.session.user.id);
    } else {
      console.log("No active session found");
    }
    
    return data.session?.user ?? null;
  } catch (error) {
    console.error("Error checking auth session:", error);
    return null;
  }
};
