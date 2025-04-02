
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

const Auth = () => {
  const { signIn, signUp, isLoading, authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    }
  };

  const handleSignUp = async (email: string, password: string, orgName: string) => {
    setError(null);
    try {
      await signUp(email, password, orgName);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rubberband-dark to-rubberband-secondary p-4">
      <div className="w-full max-w-md">
        {(error || authError) && (
          <Alert variant="destructive" className="mb-4">
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
