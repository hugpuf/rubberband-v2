
export type OnboardingState = {
  step: number;
  totalSteps: number;
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
  isCompleted: boolean;
};

export type OnboardingContextType = {
  onboarding: OnboardingState;
  currentStep: number;
  isLoading: boolean;
  updatePersonalDetails: (details: Partial<OnboardingState["personalDetails"]>) => void;
  updateOrganizationDetails: (details: Partial<OnboardingState["organizationDetails"]>) => void;
  updateUseCaseDetails: (details: Partial<OnboardingState["useCaseDetails"]>) => void;
  connectIntegration: (provider: "google" | "microsoft", connected: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  saveOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
};

export const initialOnboardingState: OnboardingState = {
  step: 1,
  totalSteps: 5,
  personalDetails: {
    firstName: "",
    lastName: "",
    avatarUrl: null,
  },
  organizationDetails: {
    name: "",
    workspaceHandle: "",
    logoUrl: null,
    country: "",
    referralSource: null,
  },
  useCaseDetails: {
    primaryUseCase: null,
    businessType: null,
    workflowStyle: null,
  },
  integrations: {
    googleConnected: false,
    microsoftConnected: false,
  },
  isCompleted: false,
};
