
import { supabase } from "@/integrations/supabase/client";
import { OnboardingState } from "./types";
import { User } from "@supabase/supabase-js";
import { NavigateFunction } from "react-router-dom";

export const saveOnboarding = async (
  user: User | null,
  onboarding: OnboardingState,
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>,
  navigate: NavigateFunction,
  toast: any
) => {
  if (!user) return;
  
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
    
    return true;
  } catch (error: any) {
    console.error('Error saving onboarding data:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to save your information.",
    });
    
    return false;
  }
};

export const skipOnboarding = async (
  user: User | null,
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>,
  navigate: NavigateFunction,
  toast: any
) => {
  if (!user) return;
  
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
    
    return true;
  } catch (error: any) {
    console.error('Error skipping onboarding:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to skip onboarding.",
    });
    
    return false;
  }
};
