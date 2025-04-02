
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

type OnboardingContextType = {
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

const initialOnboardingState: OnboardingState = {
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

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboarding, setOnboarding] = useState<OnboardingState>(initialOnboardingState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load any existing onboarding data from the database
    const fetchOnboardingData = async () => {
      if (!user) return;
      
      try {
        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setOnboarding(prev => ({
            ...prev,
            personalDetails: {
              firstName: profileData.first_name || '',
              lastName: profileData.last_name || '',
              avatarUrl: profileData.avatar_url
            }
          }));
        }

        // Get user's organization
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (roleData?.organization_id) {
          // Get organization details
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', roleData.organization_id)
            .single();

          if (orgData) {
            setOnboarding(prev => ({
              ...prev,
              organizationDetails: {
                name: orgData.name || '',
                workspaceHandle: orgData.workspace_handle || '',
                logoUrl: orgData.logo_url,
                country: orgData.country || '',
                referralSource: orgData.referral_source
              }
            }));
          }

          // Get organization settings
          const { data: settingsData } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', roleData.organization_id)
            .single();

          if (settingsData) {
            setOnboarding(prev => ({
              ...prev,
              useCaseDetails: {
                primaryUseCase: settingsData.primary_use_case,
                businessType: settingsData.business_type,
                workflowStyle: settingsData.workflow_style
              },
              isCompleted: !!settingsData.has_completed_onboarding
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      }
    };

    fetchOnboardingData();
  }, [user]);

  const updatePersonalDetails = (details: Partial<OnboardingState["personalDetails"]>) => {
    setOnboarding(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        ...details
      }
    }));
  };

  const updateOrganizationDetails = (details: Partial<OnboardingState["organizationDetails"]>) => {
    setOnboarding(prev => ({
      ...prev,
      organizationDetails: {
        ...prev.organizationDetails,
        ...details
      }
    }));
  };

  const updateUseCaseDetails = (details: Partial<OnboardingState["useCaseDetails"]>) => {
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

  const saveOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          first_name: onboarding.personalDetails.firstName,
          last_name: onboarding.personalDetails.lastName,
          avatar_url: onboarding.personalDetails.avatarUrl,
          full_name: `${onboarding.personalDetails.firstName} ${onboarding.personalDetails.lastName}`
        })
        .eq('id', user.id);
      
      // Get user's organization
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();
        
      if (roleData?.organization_id) {
        // Update organization
        await supabase
          .from('organizations')
          .update({
            name: onboarding.organizationDetails.name,
            workspace_handle: onboarding.organizationDetails.workspaceHandle,
            logo_url: onboarding.organizationDetails.logoUrl,
            country: onboarding.organizationDetails.country,
            referral_source: onboarding.organizationDetails.referralSource
          })
          .eq('id', roleData.organization_id);
          
        // Update organization settings - handle with separate direct function call
        const { error } = await supabase.functions.invoke('update_organization_settings', {
          body: {
            org_id: roleData.organization_id,
            primary_use_case: onboarding.useCaseDetails.primaryUseCase,
            business_type: onboarding.useCaseDetails.businessType, 
            workflow_style: onboarding.useCaseDetails.workflowStyle,
            completed_onboarding: true
          }
        });
        
        if (error) {
          console.error('Error updating organization settings:', error);
          throw error;
        }
      }
      
      setOnboarding(prev => ({
        ...prev,
        isCompleted: true
      }));
      
      toast({
        title: "Onboarding complete!",
        description: "Your workspace is ready to use.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save your information.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const skipOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get user's organization
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
        
      if (roleData?.organization_id) {
        // Mark onboarding as completed - use the functions invoke
        const { error } = await supabase.functions.invoke('update_organization_settings', {
          body: {
            org_id: roleData.organization_id,
            completed_onboarding: true
          }
        });
        
        if (error) {
          console.error('Error updating organization settings:', error);
          throw error;
        }
      }
      
      setOnboarding(prev => ({
        ...prev,
        isCompleted: true
      }));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
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
    saveOnboarding,
    skipOnboarding
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
