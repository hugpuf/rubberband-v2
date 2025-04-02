
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { CheckCircle2 } from "lucide-react";

export function FinishStep() {
  const { saveOnboarding, onboarding } = useOnboarding();
  
  const profileComplete = onboarding.personalDetails.firstName && onboarding.personalDetails.lastName;
  const organizationComplete = onboarding.organizationDetails.name && onboarding.organizationDetails.workspaceHandle;
  const useCaseComplete = onboarding.useCaseDetails.primaryUseCase;
  
  return (
    <OnboardingLayout
      showBackButton={true}
      showNextButton={false}
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Almost Done!</h1>
          <p className="text-muted-foreground">Review your information and complete setup</p>
        </div>
        
        <div className="py-4 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-medium flex items-center">
              <CheckCircle2 className={`mr-2 h-5 w-5 ${profileComplete ? 'text-green-500' : 'text-gray-400'}`} />
              Personal Details
            </h3>
            
            {profileComplete ? (
              <div className="pl-7">
                <p>{onboarding.personalDetails.firstName} {onboarding.personalDetails.lastName}</p>
              </div>
            ) : (
              <div className="pl-7 text-amber-600 text-sm">
                Personal details incomplete
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-medium flex items-center">
              <CheckCircle2 className={`mr-2 h-5 w-5 ${organizationComplete ? 'text-green-500' : 'text-gray-400'}`} />
              Organization
            </h3>
            
            {organizationComplete ? (
              <div className="pl-7 space-y-1">
                <p><strong>Name:</strong> {onboarding.organizationDetails.name}</p>
                <p><strong>Workspace:</strong> rubberband.os/{onboarding.organizationDetails.workspaceHandle}</p>
                {onboarding.organizationDetails.country && (
                  <p><strong>Country:</strong> {onboarding.organizationDetails.country}</p>
                )}
              </div>
            ) : (
              <div className="pl-7 text-amber-600 text-sm">
                Organization details incomplete
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-medium flex items-center">
              <CheckCircle2 className={`mr-2 h-5 w-5 ${useCaseComplete ? 'text-green-500' : 'text-gray-400'}`} />
              Use Case Configuration
            </h3>
            
            {useCaseComplete ? (
              <div className="pl-7 space-y-1">
                <p><strong>Primary Use Case:</strong> {onboarding.useCaseDetails.primaryUseCase}</p>
                {onboarding.useCaseDetails.businessType && (
                  <p><strong>Business Type:</strong> {onboarding.useCaseDetails.businessType}</p>
                )}
                {onboarding.useCaseDetails.workflowStyle && (
                  <p><strong>Workflow Style:</strong> {onboarding.useCaseDetails.workflowStyle}</p>
                )}
              </div>
            ) : (
              <div className="pl-7 text-amber-600 text-sm">
                Use case configuration incomplete
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-medium flex items-center">
              <CheckCircle2 className={`mr-2 h-5 w-5 text-green-500`} />
              Integrations
            </h3>
            
            <div className="pl-7">
              <p>
                {onboarding.integrations.googleConnected || onboarding.integrations.microsoftConnected ? (
                  <>Connected: {[
                    onboarding.integrations.googleConnected && 'Google',
                    onboarding.integrations.microsoftConnected && 'Microsoft'
                  ].filter(Boolean).join(', ')}</>
                ) : (
                  'No integrations connected (optional)'
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={saveOnboarding}
            className="w-full"
            size="lg"
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
