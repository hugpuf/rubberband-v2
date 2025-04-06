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
  const [dataFetched, setDataFetched] = useState(false);
  const { user, sessionChecked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("OnboardingProvider - User:", user?.id, "Session checked:", sessionChecked, "Data fetched:", dataFetched);

  useEffect(() => {
    // Only fetch if we have a user, session is checked, and data hasn't been fetched yet
    const loadOnboardingData = async () => {
      if (!user || dataFetched || !sessionChecked) {
        console.log("OnboardingProvider - Skipping data fetch:", 
          !user ? "no user" : !sessionChecked ? "session not checked" : "data already fetched");
        return;
      }
      
      console.log("OnboardingProvider - Fetching onboarding data for user:", user.id);
      setIsLoading(true);
      try {
        await fetchOnboardingData(user, setOnboarding);
        setDataFetched(true);
        console.log("OnboardingProvider - Data fetch complete");
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
        // Add a toast notification for the error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your onboarding data. Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOnboardingData();
  }, [user, dataFetched, sessionChecked, toast]);
  
  // Reset data fetched state when user changes or logs out
  useEffect(() => {
    if (!user && dataFetched) {
      console.log("OnboardingProvider - User logged out, resetting data fetched state");
      setDataFetched(false);
      setOnboarding(initialOnboardingState);
    }
  }, [user, dataFetched]);
  
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

  // Create the onboardingActions object as required by OnboardingContextType
  const onboardingActions = {
    updateStep: goToStep,
    setPrimaryUseCase: (value: string) => updateUseCaseDetails({ primaryUseCase: value }),
    setBusinessType: (value: string) => updateUseCaseDetails({ businessType: value }),
    setWorkflowStyle: (value: string) => updateUseCaseDetails({ workflowStyle: value }),
    completeOnboarding: handleSaveOnboarding
  };

  const contextValue: OnboardingContextType = {
    onboarding,
    onboardingActions,
    currentStep: onboarding.step,
    isLoading,
    dataFetched,
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
