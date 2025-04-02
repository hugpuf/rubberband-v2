
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
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      // Get user's organization
      const { data: orgData, error: orgError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
        
      if (orgError) {
        console.error("Error getting organization:", orgError);
        return false;
      }
      
      // Check if onboarding is completed
      const { data: settingsData, error: settingsError } = await supabase
        .from('organization_settings')
        .select('has_completed_onboarding')
        .eq('organization_id', orgData.organization_id)
        .single();
      
      if (settingsError) {
        console.error("Error checking onboarding status:", settingsError);
        return false;
      }
      
      return !!settingsData?.has_completed_onboarding;
    } catch (error) {
      console.error("Error in checkOnboardingStatus:", error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Check if onboarding is completed
        const isOnboardingCompleted = await checkOnboardingStatus(data.user.id);
        
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
      
      // 1. Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create organization and set user role as admin
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: orgName }])
          .select();

        if (orgError) throw orgError;

        if (orgData && orgData[0]) {
          const orgId = orgData[0].id;
          
          // 3. Create user role as admin
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([
              {
                user_id: authData.user.id,
                organization_id: orgId,
                role: "admin",
              },
            ]);

          if (roleError) throw roleError;
        }

        toast({
          title: "Account created!",
          description: "Let's complete your account setup.",
        });
        
        // Redirect to onboarding flow for new users
        navigate("/onboarding");
      }
    } catch (error: any) {
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
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
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
