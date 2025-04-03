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
  
  console.log("User account created successfully:", data.user.id);
  return data.user;
};

export const createOrganization = async (orgName: string) => {
  console.log("STEP 2: Creating organization:", orgName);
  
  // Simplified approach - insert only the required fields
  const organizationData = {
    name: orgName
  };
  
  console.log("Organization data being sent:", organizationData);
  
  try {
    // First attempt - simple insert with minimal data
    const { data, error } = await supabase
      .from('organizations')
      .insert(organizationData)
      .select('id')
      .single();
      
    if (error) {
      console.error("Organization creation error:", error);
      console.error("Error details:", error.message, error.code, error.details);
      throw error;
    }
    
    if (!data || !data.id) {
      throw new Error("Organization created but no ID returned");
    }
    
    console.log("Organization created successfully with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Failed to create organization:", error);
    throw error;
  }
};

export const createUserRole = async (userId: string, orgId: string, role: string = "admin") => {
  console.log("STEP 3: Creating user role for user", userId, "in organization", orgId);
  
  const roleData = {
    user_id: userId,
    organization_id: orgId,
    role
  };
  
  console.log("Role data being sent:", roleData);
  
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert([roleData]);

    if (error) {
      console.error("Error creating user role:", error);
      console.error("Error details:", error.message, error.code, error.details);
      throw error;
    }
    
    console.log("User role created successfully");
    return true;
  } catch (error: any) {
    console.error("Exception in createUserRole:", error);
    throw error;
  }
};

export const verifyUserProfile = async (userId: string, email: string) => {
  console.log("STEP 4: Verifying user profile exists");
  console.log("Profile check data:", { id: userId });
  
  const { data, error: profileCheckError } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId);
    
  if (profileCheckError) {
    console.error("Error checking profile:", profileCheckError);
  }
  
  if (!data || data.length === 0) {
    console.log("Profile not found, creating manually");
    
    const profileData = {
      id: userId,
      email: email
    };
    
    console.log("Profile data being sent:", profileData);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);
      
    if (profileError) {
      console.error("Error creating profile:", profileError);
      console.error("Error details:", profileError.message, profileError.code, profileError.details);
      // Don't block the signup flow for this error since profile might be created via trigger
    } else {
      console.log("Profile created manually");
    }
  } else {
    console.log("Profile already exists");
  }
  
  return true;
};

export const createOrganizationSettings = async (orgId: string) => {
  console.log("STEP 5: Creating organization settings");
  
  const settingsData = {
    organization_id: orgId,
    has_completed_onboarding: false
  };
  
  console.log("Organization settings data being sent:", settingsData);
  
  try {
    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('organization_settings')
      .select('id')
      .eq('organization_id', orgId);
      
    if (checkError) {
      console.error("Error checking organization settings:", checkError);
    }
    
    // Only create settings if they don't exist
    if (!existingSettings || existingSettings.length === 0) {
      const { error } = await supabase
        .from('organization_settings')
        .insert([settingsData]);
        
      if (error) {
        console.error("Error creating organization settings:", error);
        console.error("Error details:", error.message, error.code, error.details);
        // Don't block signup for this error since settings might be created via trigger
      } else {
        console.log("Organization settings created successfully");
      }
    } else {
      console.log("Organization settings already exist");
    }
    
    return true;
  } catch (error) {
    console.error("Exception in createOrganizationSettings:", error);
    // Don't throw here as the trigger should handle this
    return true;
  }
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
