
import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType } from "./types";
import { 
  checkOnboardingStatus,
  createUserAccount,
  createOrganization,
  createUserRole,
  verifyUserProfile,
  createOrganizationSettings,
  getAuthSession
} from "./auth-api";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const currentUser = await getAuthSession();
        setUser(currentUser);
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
    setIsLoading(true);
    
    try {
      console.log("Starting signup process for:", email, "with organization:", orgName);
      
      // Step 1: Create user account
      let authUser;
      try {
        authUser = await createUserAccount(email, password);
        console.log("User account created:", authUser.id);
      } catch (error: any) {
        console.error("Failed to create user account:", error);
        toast({
          variant: "destructive",
          title: "Account creation failed",
          description: error.message || "Could not create user account. Please try again.",
        });
        throw error;
      }
      
      // Step 2: Create organization
      let orgId;
      try {
        orgId = await createOrganization(orgName);
        console.log("Organization created:", orgId);
      } catch (error: any) {
        console.error("Failed to create organization:", error);
        toast({
          variant: "destructive",
          title: "Organization creation failed",
          description: "Could not create organization. Sign up still succeeded - please try logging in.",
        });
        
        // Continue the flow - we'll let the user log in normally
        navigate("/auth");
        setIsLoading(false);
        return;
      }
      
      // Step 3: Create user role (link user to organization)
      try {
        await createUserRole(authUser.id, orgId);
        console.log("User role created for user", authUser.id, "in organization", orgId);
      } catch (error: any) {
        console.error("Failed to create user role:", error);
        toast({
          variant: "destructive",
          title: "Role assignment failed",
          description: "Sign up succeeded but role assignment failed. Please try logging in.",
        });
        
        navigate("/auth");
        setIsLoading(false);
        return;
      }
      
      // Step 4: Verify user profile
      try {
        await verifyUserProfile(authUser.id, email);
        console.log("User profile verified/created for user:", authUser.id);
      } catch (error: any) {
        console.error("Failed to verify user profile:", error);
        // Non-critical error, continue
      }
      
      // Step 5: Ensure organization settings exist
      try {
        await createOrganizationSettings(orgId);
        console.log("Organization settings created for organization:", orgId);
      } catch (error: any) {
        console.error("Failed to create organization settings:", error);
        // Non-critical error, continue
      }

      toast({
        title: "Account created!",
        description: "Let's complete your account setup.",
      });
      
      console.log("Signup process completed successfully, redirecting to onboarding");
      
      // Redirect to onboarding flow for new users
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message || "An error occurred during signup");
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
      });
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
