
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, orgName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to dashboard on successful login
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, orgName: string) => {
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
      }

      toast({
        title: "Account created!",
        description: "Your account has been created and organization setup.",
      });
      navigate("/dashboard");
    } catch (error: any) {
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
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error signing out",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
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
