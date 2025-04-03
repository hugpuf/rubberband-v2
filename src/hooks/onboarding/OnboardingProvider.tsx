
import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingContext } from "./onboardingContext";
import { OnboardingContextType, initialOnboardingState } from "./types";
import { fetchOnboardingData } from "./fetchOnboardingData";
import { saveOnboarding, skipOnboarding } from "./onboardingOperations";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboarding, setOnboarding] = useState(initialOnboardingState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load any existing onboarding data from the database
    fetchOnboardingData(user, setOnboarding);
  }, [user]);
  
  const updatePersonalDetails = (details: Partial<typeof onboarding.personalDetails>) => {
    setOnboarding(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        ...details
      }
    }));
  };

  const updateOrganizationDetails = (details: Partial<typeof onboarding.organizationDetails>) => {
    setOnboarding(prev => ({
      ...prev,
      organizationDetails: {
        ...prev.organizationDetails,
        ...details
      }
    }));
  };

  const updateUseCaseDetails = (details: Partial<typeof onboarding.useCaseDetails>) => {
    setOnboarding(prev => ({
      ...prev,
      useCaseDetails: {
        ...prev.useCaseDetails,
        ...details
      }
    }));
  };

  const connectIntegration = (provider: "google" | "microsoft", connected: boolean) => {
    setOnboarding(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [provider === "google" ? "googleConnected" : "microsoftConnected"]: connected
      }
    }));
  };

  const nextStep = () => {
    if (onboarding.step < onboarding.totalSteps) {
      setOnboarding(prev => ({
        ...prev,
        step: prev.step + 1
      }));
    }
  };

  const prevStep = () => {
    if (onboarding.step > 1) {
      setOnboarding(prev => ({
        ...prev,
        step: prev.step - 1
      }));
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= onboarding.totalSteps) {
      setOnboarding(prev => ({
        ...prev,
        step
      }));
    }
  };

  const handleSaveOnboarding = async () => {
    setIsLoading(true);
    try {
      await saveOnboarding(user, onboarding, setOnboarding, navigate, toast);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSkipOnboarding = async () => {
    setIsLoading(true);
    try {
      await skipOnboarding(user, setOnboarding, navigate, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: OnboardingContextType = {
    onboarding,
    currentStep: onboarding.step,
    isLoading,
    updatePersonalDetails,
    updateOrganizationDetails,
    updateUseCaseDetails,
    connectIntegration,
    nextStep,
    prevStep,
    goToStep,
    saveOnboarding: handleSaveOnboarding,
    skipOnboarding: handleSkipOnboarding
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}
