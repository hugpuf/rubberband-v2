
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, orgName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for an active session on load
    const checkUser = async () => {
      try {
        console.log("Checking for active session");
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          console.log("Active session found, user ID:", data.session.user.id);
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkOnboardingStatus = async (userId: string) => {
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

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      console.log("Starting signin process for user:", email);
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message, error);
        throw error;
      }
      
      if (data.user) {
        console.log("User successfully authenticated:", data.user.id);
        
        // Check if onboarding is completed
        const isOnboardingCompleted = await checkOnboardingStatus(data.user.id);
        
        console.log("User signed in, onboarding completed:", isOnboardingCompleted);
        
        if (isOnboardingCompleted) {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          navigate("/dashboard");
        } else {
          toast({
            title: "Welcome!",
            description: "Let's complete your account setup.",
          });
          navigate("/onboarding");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "An error occurred during login");
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, orgName: string) => {
    setAuthError(null);
    try {
      setIsLoading(true);
      console.log("Starting signup process for:", email, "with organization:", orgName);
      
      // STEP 1: Create the user account
      console.log("STEP 1: Creating user account");
      console.log("Signup data being sent:", { email });
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("User creation error:", authError.message, authError);
        console.error("Request data that failed:", { email });
        throw authError;
      }

      if (!authData.user) {
        const errorMsg = "User account creation failed - no user returned from auth";
        console.error(errorMsg);
        console.error("Request data that failed:", { email });
        throw new Error(errorMsg);
      }
      
      console.log("User created successfully:", authData.user.id);
      
      // STEP 2: Create organization
      console.log("STEP 2: Creating organization:", orgName);
      console.log("Organization data being sent:", { name: orgName });
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: orgName }])
        .select();

      if (orgError) {
        console.error("Error creating organization:", orgError.message, orgError);
        console.error("Organization data attempted:", { name: orgName });
        console.error("User context:", { userId: authData.user.id });
        throw orgError;
      }

      if (!orgData || orgData.length === 0) {
        const errorMsg = "Failed to create organization - no data returned";
        console.error(errorMsg);
        console.error("Organization data attempted:", { name: orgName });
        console.error("User context:", { userId: authData.user.id });
        throw new Error(errorMsg);
      }
      
      const orgId = orgData[0].id;
      console.log("Organization created successfully:", orgId);
      
      // STEP 3: Create user role as admin
      console.log("STEP 3: Creating user role for user", authData.user.id, "in organization", orgId);
      console.log("Role data being sent:", {
        user_id: authData.user.id,
        organization_id: orgId,
        role: "admin",
      });
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            organization_id: orgId,
            role: "admin",
          },
        ]);

      if (roleError) {
        console.error("Error creating user role:", roleError.message, roleError);
        console.error("Role data attempted:", {
          user_id: authData.user.id,
          organization_id: orgId,
          role: "admin",
        });
        console.error("Transaction context:", { organizationCreated: true });
        throw roleError;
      }
      
      console.log("User role created successfully");

      // STEP 4: Create or verify user profile
      console.log("STEP 4: Verifying user profile exists");
      console.log("Profile check data:", { id: authData.user.id });
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select()
        .eq('id', authData.user.id);
        
      if (profileCheckError) {
        console.error("Error checking profile:", profileCheckError.message, profileCheckError);
        console.error("Profile check data:", { id: authData.user.id });
      }
      
      if (!profileData || profileData.length === 0) {
        console.log("Profile not found, creating manually");
        console.log("Profile data being sent:", {
          id: authData.user.id,
          email: email
        });
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email
            },
          ]);
          
        if (profileError) {
          console.error("Error creating profile:", profileError.message, profileError);
          console.error("Profile data attempted:", {
            id: authData.user.id,
            email: email
          });
          console.error("Transaction context:", { organizationCreated: true, roleCreated: true });
          throw profileError;
        }
        console.log("Profile created manually");
      } else {
        console.log("Profile already exists");
      }

      // STEP 5: Create organization settings
      console.log("STEP 5: Creating organization settings");
      console.log("Organization settings data being sent:", {
        organization_id: orgId,
        has_completed_onboarding: false
      });
      
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert([{
          organization_id: orgId,
          has_completed_onboarding: false
        }]);
        
      if (settingsError) {
        console.error("Error creating organization settings:", settingsError.message, settingsError);
        console.error("Settings data attempted:", {
          organization_id: orgId,
          has_completed_onboarding: false
        });
        console.error("Transaction context:", { 
          organizationCreated: true, 
          roleCreated: true,
          profileCreated: true 
        });
        throw settingsError;
      }
      
      console.log("Organization settings created successfully");

      toast({
        title: "Account created!",
        description: "Let's complete your account setup.",
      });
      
      console.log("Signup process completed successfully, redirecting to onboarding");
      
      // Redirect to onboarding flow for new users
      setTimeout(() => {
        navigate("/onboarding");
      }, 0);
    } catch (error: any) {
      console.error("Signup error:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      setAuthError(error.message || "An error occurred during signup");
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been signed out successfully.",
      });
      console.log("Sign out completed");
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message || "Error signing out");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error signing out",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
