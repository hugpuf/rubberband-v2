
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
        console.log("Fetching onboarding data for user:", user.id);
        
        // Get user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, email')
          .eq('id', user.id);

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        if (profileData && profileData.length > 0) {
          console.log("Profile data found:", profileData[0]);
          setOnboarding(prev => ({
            ...prev,
            personalDetails: {
              firstName: profileData[0].first_name || '',
              lastName: profileData[0].last_name || '',
              avatarUrl: profileData[0].avatar_url
            }
          }));
        } else {
          console.log("No profile data found, creating one");
          // Create profile if it doesn't exist
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email || ''
              },
            ]);
            
          if (createProfileError) {
            console.error("Error creating profile:", createProfileError);
          }
        }

        // Get user's organization - don't use single() to avoid 406 errors
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('organization_id, role')
          .eq('user_id', user.id);

        if (roleError) {
          console.error("Error fetching role data:", roleError);
          return;
        }

        if (!roleData || roleData.length === 0) {
          console.log("No organization role found for user");
          return;
        }
        
        console.log("User role found:", roleData[0]);
        
        if (roleData[0].organization_id) {
          // Get organization details
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', roleData[0].organization_id);

          if (orgError) {
            console.error("Error fetching organization data:", orgError);
            return;
          }

          if (orgData && orgData.length > 0) {
            console.log("Organization data found:", orgData[0]);
            setOnboarding(prev => ({
              ...prev,
              organizationDetails: {
                name: orgData[0].name || '',
                workspaceHandle: orgData[0].workspace_handle || '',
                logoUrl: orgData[0].logo_url,
                country: orgData[0].country || '',
                referralSource: orgData[0].referral_source
              }
            }));
          }

          // Get organization settings
          const { data: settingsData, error: settingsError } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', roleData[0].organization_id);

          if (settingsError) {
            console.error("Error fetching organization settings:", settingsError);
            return;
          }

          if (settingsData && settingsData.length > 0) {
            console.log("Organization settings found:", settingsData[0]);
            setOnboarding(prev => ({
              ...prev,
              useCaseDetails: {
                primaryUseCase: settingsData[0].primary_use_case,
                businessType: settingsData[0].business_type,
                workflowStyle: settingsData[0].workflow_style
              },
              isCompleted: !!settingsData[0].has_completed_onboarding
            }));
          } else {
            console.log("No organization settings found, creating default settings");
            // Create settings if they don't exist
            const { error: createSettingsError } = await supabase
              .from('organization_settings')
              .insert([
                {
                  organization_id: roleData[0].organization_id,
                  has_completed_onboarding: false
                },
              ]);
              
            if (createSettingsError) {
              console.error("Error creating organization settings:", createSettingsError);
            }
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
      console.log("Saving onboarding data for user:", user.id);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: onboarding.personalDetails.firstName,
          last_name: onboarding.personalDetails.lastName,
          avatar_url: onboarding.personalDetails.avatarUrl,
          full_name: `${onboarding.personalDetails.firstName} ${onboarding.personalDetails.lastName}`
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }
      
      // Get user's organization
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('organization_id, role')
        .eq('user_id', user.id);
        
      if (roleError) {
        console.error("Error getting user role:", roleError);
        throw roleError;
      }
      
      if (!roleData || roleData.length === 0) {
        throw new Error("User does not have an organization");
      }
        
      if (roleData[0].organization_id) {
        // Update organization
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            name: onboarding.organizationDetails.name,
            workspace_handle: onboarding.organizationDetails.workspaceHandle,
            logo_url: onboarding.organizationDetails.logoUrl,
            country: onboarding.organizationDetails.country,
            referral_source: onboarding.organizationDetails.referralSource
          })
          .eq('id', roleData[0].organization_id);
          
        if (orgError) {
          console.error("Error updating organization:", orgError);
          throw orgError;
        }
          
        // Update organization settings
        const { error: settingsError } = await supabase
          .from('organization_settings')
          .update({
            primary_use_case: onboarding.useCaseDetails.primaryUseCase,
            business_type: onboarding.useCaseDetails.businessType, 
            workflow_style: onboarding.useCaseDetails.workflowStyle,
            has_completed_onboarding: true
          })
          .eq('organization_id', roleData[0].organization_id);
        
        if (settingsError) {
          console.error('Error updating organization settings:', settingsError);
          throw settingsError;
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
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user.id);
        
      if (roleError) {
        console.error("Error getting user role:", roleError);
        throw roleError;
      }
      
      if (!roleData || roleData.length === 0) {
        throw new Error("User does not have an organization");
      }
        
      if (roleData[0].organization_id) {
        // Mark onboarding as completed
        const { error: settingsError } = await supabase
          .from('organization_settings')
          .update({
            has_completed_onboarding: true
          })
          .eq('organization_id', roleData[0].organization_id);
        
        if (settingsError) {
          console.error('Error updating organization settings:', settingsError);
          throw settingsError;
        }
      }
      
      setOnboarding(prev => ({
        ...prev,
        isCompleted: true
      }));
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error skipping onboarding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to skip onboarding.",
      });
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
