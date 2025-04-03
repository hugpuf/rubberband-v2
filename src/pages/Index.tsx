import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/onboarding";
import { useEffect } from "react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const { onboarding } = useOnboarding();
  
  useEffect(() => {
    // Log onboarding state for debugging
    if (user) {
      console.log("Index page - User logged in:", user.id);
      console.log("Index page - Onboarding completed:", onboarding.isCompleted);
    }
  }, [user, onboarding]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect based on auth and onboarding status
  if (user) {
    if (!onboarding.isCompleted) {
      console.log("User authenticated but onboarding not complete, redirecting to onboarding");
      return <Navigate to="/onboarding" />;
    } else {
      console.log("User authenticated and onboarding complete, redirecting to dashboard");
      return <Navigate to="/dashboard" />;
    }
  } else {
    console.log("User not authenticated, redirecting to auth");
    return <Navigate to="/auth" />;
  }
};

export default Index;
