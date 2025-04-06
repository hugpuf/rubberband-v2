
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/onboarding";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading: authLoading, sessionChecked } = useAuth();
  const { onboarding, isLoading: onboardingLoading, dataFetched } = useOnboarding();
  
  // Show global loading state when checking session or onboarding status
  if (authLoading || (user && !dataFetched) || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Ensure we've checked session before proceeding with routing decisions
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Redirect based on auth and onboarding status
  if (user) {
    if (!onboarding.isCompleted) {
      return <Navigate to="/onboarding" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  } else {
    return <Navigate to="/auth" />;
  }
};

export default Index;
