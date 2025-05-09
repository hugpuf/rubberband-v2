
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/onboarding";
import { PersonalDetailsStep } from "@/components/onboarding/PersonalDetailsStep";
import { CompanyDetailsStep } from "@/components/onboarding/CompanyDetailsStep";
import { UseCaseStep } from "@/components/onboarding/UseCaseStep";
import { IntegrationsStep } from "@/components/onboarding/IntegrationsStep";
import { FinishStep } from "@/components/onboarding/FinishStep";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const { user, isLoading: authLoading, sessionChecked } = useAuth();
  const { onboarding, isLoading: onboardingLoading, dataFetched } = useOnboarding();
  
  console.log("Onboarding page - Auth status:", sessionChecked ? "checked" : "checking", "User:", user?.id);
  console.log("Onboarding page - Onboarding status:", dataFetched ? "loaded" : "loading", "Step:", onboarding.step);
  
  // Determine if we're still validating the session or loading onboarding data
  const isValidatingSession = authLoading || !sessionChecked;
  const isLoadingOnboardingData = user && (!dataFetched || onboardingLoading);
  const isLoading = isValidatingSession || isLoadingOnboardingData;
  
  // Show loading state when necessary
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {isValidatingSession ? "Verifying your session..." : "Preparing your onboarding experience..."}
          </p>
        </div>
      </div>
    );
  }
  
  // Once loading is complete, handle redirects before rendering onboarding content
  
  // Redirect unauthenticated users to auth page
  if (!user) {
    console.log("Onboarding page - No user found, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect completed users to dashboard
  if (onboarding.isCompleted) {
    console.log("Onboarding page - Onboarding completed, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log("Onboarding page - Rendering step:", onboarding.step);
  
  // Show the appropriate onboarding step based on the current step
  const renderStep = () => {
    switch (onboarding.step) {
      case 1:
        return <PersonalDetailsStep />;
      case 2:
        return <CompanyDetailsStep />;
      case 3:
        return <UseCaseStep />;
      case 4:
        return <IntegrationsStep />;
      case 5:
        return <FinishStep />;
      default:
        return <PersonalDetailsStep />;
    }
  };
  
  return renderStep();
}
