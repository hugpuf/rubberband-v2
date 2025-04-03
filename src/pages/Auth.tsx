
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";

const Auth = () => {
  const { signIn, signUp, isLoading, authError, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
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
