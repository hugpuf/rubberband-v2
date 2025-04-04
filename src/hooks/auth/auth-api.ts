
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Get the current session
export const getAuthSession = async (): Promise<User | null> => {
  try {
    console.log("auth-api: Getting current session");
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("auth-api: Error getting session:", error.message);
      throw error;
    }
    
    return data.session?.user || null;
  } catch (error) {
    console.error("auth-api: Error getting session:", error);
    return null;
  }
};

// Verify if a user exists in the database
export const verifyUserExists = async (userId: string): Promise<boolean> => {
  try {
    console.log("auth-api: Verifying if user exists in database:", userId);
    
    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("auth-api: Error checking profile:", profileError);
      throw profileError;
    }
    
    // Check if the user has a role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (roleError) {
      console.error("auth-api: Error checking user role:", roleError);
      throw roleError;
    }
    
    // User exists if both profile and role are present
    const userExists = !!profile && !!userRole;
    console.log("auth-api: User exists check result:", userExists);
    
    return userExists;
  } catch (error) {
    console.error("auth-api: Error verifying user exists:", error);
    return false;
  }
};

// Check if a user has completed onboarding
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log("auth-api: Checking onboarding status for user:", userId);
    
    // Get the user's organization
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (roleError) {
      console.error("auth-api: Error getting user roles:", roleError);
      throw roleError;
    }
    
    if (!userRoles || !userRoles.organization_id) {
      console.log("auth-api: No organization found for user");
      return false;
    }
    
    // Check if the organization has completed onboarding
    const { data: settings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('has_completed_onboarding')
      .eq('organization_id', userRoles.organization_id)
      .maybeSingle();
      
    if (settingsError) {
      console.error("auth-api: Error getting organization settings:", settingsError);
      throw settingsError;
    }
    
    const isCompleted = settings?.has_completed_onboarding || false;
    console.log("auth-api: Onboarding completion status:", isCompleted);
    
    return isCompleted;
  } catch (error) {
    console.error("auth-api: Error checking onboarding status:", error);
    return false;
  }
};

// Create a user account
export const createUserAccount = async (email: string, password: string): Promise<User> => {
  try {
    console.log("auth-api: Creating user account for:", email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error("auth-api: Error creating user account:", error);
      throw error;
    }
    
    if (!data.user) {
      console.error("auth-api: No user returned after signup");
      throw new Error("Failed to create user account");
    }
    
    console.log("auth-api: User account created:", data.user.id);
    return data.user;
  } catch (error) {
    console.error("auth-api: Error creating user account:", error);
    throw error;
  }
};

// Create an organization
export const createOrganization = async (name: string): Promise<string> => {
  try {
    console.log("auth-api: Creating organization:", name);
    
    const { data, error } = await supabase
      .from('organizations')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) {
      console.error("auth-api: Error creating organization:", error);
      throw error;
    }
    
    if (!data || !data.id) {
      console.error("auth-api: No organization ID returned after insert");
      throw new Error("Failed to create organization");
    }
    
    console.log("auth-api: Organization created:", data.id);
    return data.id;
  } catch (error) {
    console.error("auth-api: Error creating organization:", error);
    throw error;
  }
};

// Create a user role (link user to organization)
export const createUserRole = async (userId: string, organizationId: string, role: string = 'admin'): Promise<void> => {
  try {
    console.log("auth-api: Creating user role for user:", userId, "in organization:", organizationId);
    
    const { error } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userId,
        organization_id: organizationId,
        role,
      }]);
      
    if (error) {
      console.error("auth-api: Error creating user role:", error);
      throw error;
    }
    
    console.log("auth-api: User role created successfully");
  } catch (error) {
    console.error("auth-api: Error creating user role:", error);
    throw error;
  }
};

// Verify and create user profile if needed
export const verifyUserProfile = async (userId: string, email: string): Promise<void> => {
  try {
    console.log("auth-api: Verifying/creating profile for user:", userId);
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error("auth-api: Error checking profile:", checkError);
      throw checkError;
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("auth-api: Profile not found, creating new profile");
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email,
        }]);
        
      if (insertError) {
        console.error("auth-api: Error creating profile:", insertError);
        throw insertError;
      }
      
      console.log("auth-api: Profile created successfully");
    } else {
      console.log("auth-api: Profile already exists");
    }
  } catch (error) {
    console.error("auth-api: Error verifying/creating profile:", error);
    throw error;
  }
};

// Create organization settings
export const createOrganizationSettings = async (organizationId: string): Promise<void> => {
  try {
    console.log("auth-api: Creating settings for organization:", organizationId);
    
    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('organization_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();
      
    if (checkError) {
      console.error("auth-api: Error checking organization settings:", checkError);
      throw checkError;
    }
    
    // If settings don't exist, create them
    if (!existingSettings) {
      console.log("auth-api: Settings not found, creating new settings record");
      
      const { error: insertError } = await supabase
        .from('organization_settings')
        .insert([{
          organization_id: organizationId,
          has_completed_onboarding: false,
        }]);
        
      if (insertError) {
        console.error("auth-api: Error creating organization settings:", insertError);
        throw insertError;
      }
      
      console.log("auth-api: Organization settings created successfully");
    } else {
      console.log("auth-api: Organization settings already exist");
    }
  } catch (error) {
    console.error("auth-api: Error creating organization settings:", error);
    throw error;
  }
};
