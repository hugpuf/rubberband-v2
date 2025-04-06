
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
  
  // Handle all loading states
  if (authLoading || !sessionChecked || (user && !dataFetched) || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Preparing your onboarding experience...</p>
        </div>
      </div>
    );
  }
  
  // If user completes onboarding or is not authenticated, redirect
  if (onboarding.isCompleted) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
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
