
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/onboarding";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading: authLoading, sessionChecked } = useAuth();
  const { onboarding, isLoading: onboardingLoading, dataFetched } = useOnboarding();
  
  console.log("Index page - Auth status:", sessionChecked ? "checked" : "checking", "User:", user?.id);
  console.log("Index page - Onboarding status:", dataFetched ? "loaded" : "loading", "Completed:", onboarding.isCompleted);
  
  // Only show loading state when essential checks are happening
  // - When checking auth session
  // - When user exists but onboarding data isn't fetched yet
  const isValidatingSession = authLoading || !sessionChecked;
  const isLoadingOnboardingData = user && (!dataFetched || onboardingLoading);
  
  if (isValidatingSession || isLoadingOnboardingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {isValidatingSession ? "Verifying your session..." : "Loading your account..."}
          </p>
        </div>
      </div>
    );
  }

  // Now that all checks are complete, redirect based on user and onboarding status
  if (user) {
    console.log("Index page - Redirecting authenticated user:", 
      onboarding.isCompleted ? "to dashboard" : "to onboarding");
    
    if (onboarding.isCompleted) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  } else {
    console.log("Index page - No user found, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }
};

export default Index;
