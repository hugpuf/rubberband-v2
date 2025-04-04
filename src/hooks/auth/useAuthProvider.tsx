
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
  getAuthSession,
  verifyUserExists
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
        console.log("AuthProvider: Checking for active session");
        const currentUser = await getAuthSession();
        console.log("AuthProvider: Session check result:", currentUser ? "User found" : "No user");
        setUser(currentUser);
      } catch (error) {
        console.error("AuthProvider: Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth state changed:", event, session?.user?.id);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("AuthProvider: Cleaning up auth listener");
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      console.log("AuthProvider: Starting signin process for user:", email);
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("AuthProvider: Login error:", error.message, error);
        throw error;
      }
      
      if (data.user) {
        console.log("AuthProvider: User successfully authenticated:", data.user.id);
        
        // Check if user exists in the database (profiles, user_roles, organizations)
        const userExists = await verifyUserExists(data.user.id);
        
        if (!userExists) {
          console.error("AuthProvider: User exists in auth but not in the database - likely a deleted account");
          // Sign out the user to prevent auto-login
          await supabase.auth.signOut();
          setUser(null);
          throw new Error("No account found with these credentials. Please create a new account.");
        }
        
        // Check if onboarding is completed
        const isOnboardingCompleted = await checkOnboardingStatus(data.user.id);
        
        console.log("AuthProvider: User signed in, onboarding completed:", isOnboardingCompleted);
        
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
      console.error("AuthProvider: Login error:", error);
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
      console.log("AuthProvider: Starting signup process for:", email, "with organization:", orgName);
      
      // Step 1: Create user account
      let authUser;
      try {
        authUser = await createUserAccount(email, password);
        console.log("AuthProvider: User account created:", authUser.id);
      } catch (error: any) {
        console.error("AuthProvider: Failed to create user account:", error);
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
        console.log("AuthProvider: Organization created:", orgId);
      } catch (error: any) {
        console.error("AuthProvider: Failed to create organization:", error);
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
        console.log("AuthProvider: User role created for user", authUser.id, "in organization", orgId);
      } catch (error: any) {
        console.error("AuthProvider: Failed to create user role:", error);
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
        console.log("AuthProvider: User profile verified/created for user:", authUser.id);
      } catch (error: any) {
        console.error("AuthProvider: Failed to verify user profile:", error);
        // Non-critical error, continue
      }
      
      // Step 5: Ensure organization settings exist
      try {
        await createOrganizationSettings(orgId);
        console.log("AuthProvider: Organization settings created for organization:", orgId);
      } catch (error: any) {
        console.error("AuthProvider: Failed to create organization settings:", error);
        // Non-critical error, continue
      }

      toast({
        title: "Account created!",
        description: "Let's complete your account setup.",
      });
      
      console.log("AuthProvider: Signup process completed successfully, redirecting to onboarding");
      
      // Redirect to onboarding flow for new users
      navigate("/onboarding");
    } catch (error: any) {
      console.error("AuthProvider: Signup error:", error);
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
      console.log("AuthProvider: Signing out user");
      
      // Clear local state first
      setUser(null);
      
      // Then sign out from Supabase
      // Using the signOut method without scope parameter to avoid session errors
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("AuthProvider: Error during sign out:", error);
        throw error;
      }
      
      // Navigate after successful signout
      navigate("/auth");
      
      toast({
        title: "Logged out",
        description: "You have been signed out successfully.",
      });
      
      console.log("AuthProvider: Sign out completed");
    } catch (error: any) {
      console.error("AuthProvider: Error signing out:", error);
      setAuthError(error.message || "Error signing out");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error signing out",
      });
      
      // Even if there's an error, try to navigate to auth
      navigate("/auth");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
