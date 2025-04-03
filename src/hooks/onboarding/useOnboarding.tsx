
import { useContext } from "react";
import { OnboardingContext } from "./onboardingContext";
import { OnboardingContextType } from "./types";

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  
  return context;
}
