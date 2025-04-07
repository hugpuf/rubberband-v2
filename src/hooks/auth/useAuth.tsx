
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logUserAction } from "@/services/userLogs";
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  sessionChecked: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  signUp: (credentials: { email: string; password: string; fullName?: string }) => Promise<any>;
  updateUser: (updates: any) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
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

  const login = async (credentials: { email: string; password: string }) => {
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

  const signUp = async (credentials: { email: string; password: string; fullName?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName
          }
        }
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
        redirectTo: `${window.location.origin}/auth/update-password`
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
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
