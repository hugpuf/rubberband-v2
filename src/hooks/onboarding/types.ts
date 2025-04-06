
import { User } from "@supabase/supabase-js";

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface OrganizationDetails {
  name: string;
  workspaceHandle: string;
  logoUrl: string | null;
  country: string;
  referralSource: string | null;
}

export interface UseCaseDetails {
  primaryUseCase: string | null;
  businessType: string | null;
  workflowStyle: string | null;
}

export interface IntegrationsState {
  googleConnected: boolean;
  microsoftConnected: boolean;
}

export interface OnboardingState {
  step: number;
  primaryUseCase: string | null;
  businessType: string | null;
  workflowStyle: string | null;
  isCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  personalDetails: PersonalDetails;
  organizationDetails: OrganizationDetails;
  useCaseDetails: UseCaseDetails;
  integrations: IntegrationsState;
  totalSteps: number;
}

export const initialOnboardingState: OnboardingState = {
  step: 1,
  primaryUseCase: null,
  businessType: null,
  workflowStyle: null,
  isCompleted: false,
  isLoading: false,
  error: null,
  personalDetails: {
    firstName: "",
    lastName: "",
    avatarUrl: null
  },
  organizationDetails: {
    name: "",
    workspaceHandle: "",
    logoUrl: null,
    country: "",
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

export interface OnboardingActions {
  updateStep: (step: number) => void;
  setPrimaryUseCase: (value: string) => void;
  setBusinessType: (value: string) => void;
  setWorkflowStyle: (value: string) => void;
  completeOnboarding: () => Promise<void>;
}

export type OnboardingContextType = {
  onboarding: OnboardingState;
  onboardingActions: OnboardingActions;
  currentStep: number;
  isLoading: boolean;
  dataFetched: boolean;
  updatePersonalDetails: (details: Partial<PersonalDetails>) => void;
  updateOrganizationDetails: (details: Partial<OrganizationDetails>) => void;
  updateUseCaseDetails: (details: Partial<UseCaseDetails>) => void;
  connectIntegration: (provider: "google" | "microsoft", connected: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  saveOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
};
