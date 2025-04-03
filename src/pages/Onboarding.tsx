import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/onboarding";
import { PersonalDetailsStep } from "@/components/onboarding/PersonalDetailsStep";
import { CompanyDetailsStep } from "@/components/onboarding/CompanyDetailsStep";
import { UseCaseStep } from "@/components/onboarding/UseCaseStep";
import { IntegrationsStep } from "@/components/onboarding/IntegrationsStep";
import { FinishStep } from "@/components/onboarding/FinishStep";

export default function Onboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const { onboarding, isLoading: onboardingLoading } = useOnboarding();
  
  useEffect(() => {
    // Log current state for debugging
    console.log("Onboarding page - User:", user?.id);
    console.log("Onboarding page - Auth loading:", authLoading);
    console.log("Onboarding page - Onboarding loading:", onboardingLoading);
    console.log("Onboarding state:", onboarding);
    console.log("Onboarding step:", onboarding.step);
    console.log("Onboarding completion status:", onboarding.isCompleted);
    
    // Trigger console trace to see call stack
    console.trace("Onboarding page render trace");
  }, [user, authLoading, onboardingLoading, onboarding]);
  
  // If user completes onboarding or is not authenticated, redirect
  if (onboarding.isCompleted) {
    console.log("Onboarding completed, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!authLoading && !user) {
    console.log("User not authenticated, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }
  
  // Show the appropriate onboarding step based on the current step
  const renderStep = () => {
    console.log("Rendering onboarding step:", onboarding.step);
    
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
        console.log("No matching step found, defaulting to PersonalDetailsStep");
        return <PersonalDetailsStep />;
    }
  };
  
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rubberband-dark to-rubberband-secondary">
        <div className="animate-pulse text-white text-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return renderStep();
}
