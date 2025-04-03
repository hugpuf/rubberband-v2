
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";

const Auth = () => {
  const { signIn, signUp, isLoading, authError, user } = useAuth();
  const { onboarding } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Log auth and onboarding state for debugging
    if (user) {
      console.log("Auth page - User:", user.id);
      console.log("Auth page - Onboarding completed:", onboarding.isCompleted);
    }
  }, [user, onboarding]);
  
  // If user is already authenticated, redirect to appropriate page
  if (user) {
    if (!onboarding.isCompleted) {
      console.log("User authenticated but onboarding not complete, redirecting to onboarding");
      return <Navigate to="/onboarding" />;
    } else {
      console.log("User authenticated and onboarding complete, redirecting to dashboard");
      return <Navigate to="/dashboard" />;
    }
  }
  
  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
    }
  };

  const handleSignUp = async (email: string, password: string, orgName: string) => {
    setError(null);
    try {
      console.log("Signing up with:", email, "org:", orgName);
      await signUp(email, password, orgName);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to create account");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5F7] via-[#EAEAEC] to-[#F0F0F2]">
      <div className="w-full max-w-md px-4">
        {(error || authError) && (
          <Alert variant="destructive" className="mb-4 apple-glass border-0 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || authError}
            </AlertDescription>
          </Alert>
        )}
        <AuthForm 
          onLogin={handleSignIn} 
          onSignUp={handleSignUp} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};

export default Auth;
