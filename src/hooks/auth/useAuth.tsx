
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { logUserAction } from "@/services/userLogs";

type AuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
  sessionChecked: boolean;
  login: (credentials: LoginCredentials) => Promise<any | null>;
  logout: () => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<any | null>;
  updateUser: (updates: any) => Promise<any | null>;
  resetPassword: (email: string) => Promise<any>;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type SignUpCredentials = {
  email: string;
  password: string;
  fullName?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (err: any) {
        console.error("Session error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setSessionChecked(true);
      }
    };
    
    getSession();
    
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      setSession(session);
      setUser(session?.user || null);
    });
  }, []);
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        throw error;
      }

      setUser(data.user);
      
      // Log the login action
      logUserAction({
        module: "Auth",
        action: "login",
        metadata: { email: credentials.email }
      });
      
      return data;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Log the logout action before actually logging out
      if (user) {
        await logUserAction({
          module: "Auth",
          action: "logout",
          metadata: { userId: user.id }
        });
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
          },
        },
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });
      
      navigate("/auth");
      return data;
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        throw error;
      }

      setUser(data.user);
      return data;
    } catch (err: any) {
      console.error("Update user error:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password.",
      });
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    error,
    sessionChecked,
    login,
    logout,
    signUp,
    updateUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
