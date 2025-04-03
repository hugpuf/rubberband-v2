
export type OnboardingState = {
  step: number;
  primaryUseCase: string | null;
  businessType: string | null;
  workflowStyle: string | null;
  isCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  personalDetails: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  organizationDetails: {
    name: string;
    workspaceHandle: string;
    logoUrl: string | null;
    country: string;
    referralSource: string | null;
  };
  useCaseDetails: {
    primaryUseCase: string | null;
    businessType: string | null;
    workflowStyle: string | null;
  };
  integrations: {
    googleConnected: boolean;
    microsoftConnected: boolean;
  };
  totalSteps: number;
};

export const initialOnboardingState: OnboardingState = {
  step: 1,
  primaryUseCase: null,
  businessType: null,
  workflowStyle: null,
  isCompleted: false,
  isLoading: false,
  error: null,
  personalDetails: {
    firstName: '',
    lastName: '',
    avatarUrl: null
  },
  organizationDetails: {
    name: '',
    workspaceHandle: '',
    logoUrl: null,
    country: '',
    referralSource: null
  },
  useCaseDetails: {
    primaryUseCase: null,
    businessType: null,
    workflowStyle: null
  },
  integrations: {
    googleConnected: false,
    microsoftConnected: false
  },
  totalSteps: 5
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
  currentStep: number;
  isLoading: boolean;
  updatePersonalDetails: (details: Partial<typeof initialOnboardingState.personalDetails>) => void;
  updateOrganizationDetails: (details: Partial<typeof initialOnboardingState.organizationDetails>) => void;
  updateUseCaseDetails: (details: Partial<typeof initialOnboardingState.useCaseDetails>) => void;
  connectIntegration: (provider: "google" | "microsoft", connected: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  saveOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
};
