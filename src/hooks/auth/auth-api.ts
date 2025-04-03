
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
  console.log("Organization data being sent:", { name: orgName });
  
  // Try direct insert first
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{ name: orgName }])
      .select()
      .single();

    if (error) {
      console.error("Error creating organization (attempt 1):", error);
      // Don't throw immediately, try the second approach
      throw error;
    }
    
    console.log("Organization created successfully with ID:", data.id);
    return data.id;
  } catch (firstError) {
    console.error("First attempt failed, trying alternative approach");
    
    // Second approach: Insert with minimal data and return ID only
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single();
        
      if (error) {
        console.error("Error creating organization (attempt 2):", error);
        throw error;
      }
      
      console.log("Created organization with alternative approach:", data.id);
      return data.id;
    } catch (secondError) {
      console.error("Both organization creation attempts failed");
      throw secondError;
    }
  }
};

export const createUserRole = async (userId: string, orgId: string, role: string = "admin") => {
  console.log("STEP 3: Creating user role for user", userId, "in organization", orgId);
  console.log("Role data being sent:", {
    user_id: userId,
    organization_id: orgId,
    role,
  });
  
  try {
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
      console.error("Error creating user role:", error);
      throw error;
    }
    
    console.log("User role created successfully");
    return true;
  } catch (error) {
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
      console.error("Error creating profile:", profileError);
      // Don't block the signup flow for this error since profile might be created via trigger
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
  
  try {
    const { error } = await supabase
      .from('organization_settings')
      .insert([{
        organization_id: orgId,
        has_completed_onboarding: false
      }]);
      
    if (error) {
      console.error("Error creating organization settings:", error);
      // Don't block signup for this error since settings might be created via trigger
    }
    
    console.log("Organization settings created successfully");
    return true;
  } catch (error) {
    console.error("Exception in createOrganizationSettings:", error);
    // Don't throw here as the trigger should handle this
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
