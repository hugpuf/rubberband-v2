export type OnboardingState = {
  step: number;
  primaryUseCase: string | null;
  businessType: string | null;
  workflowStyle: string | null;
  isCompleted: boolean;
  isLoading: boolean;
  error: string | null;
};

export type OnboardingAction = {
  updateStep: (step: number) => void;
  setPrimaryUseCase: (value: string) => void;
  setBusinessType: (value: string) => void;
  setWorkflowStyle: (value: string) => void;
  completeOnboarding: () => Promise<void>;
};

export type OnboardingContextType = {
  onboarding: OnboardingState;
  onboardingActions: OnboardingAction;
};
