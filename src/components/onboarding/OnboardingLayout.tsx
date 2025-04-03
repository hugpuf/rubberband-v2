import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/onboarding";

export function OnboardingLayout({ 
  children,
  showBackButton = true,
  showNextButton = true,
  showSkipButton = false,
  nextButtonText = "Continue",
  disableNextButton = false,
  onNext,
}: { 
  children: ReactNode;
  showBackButton?: boolean;
  showNextButton?: boolean;
  showSkipButton?: boolean;
  nextButtonText?: string;
  disableNextButton?: boolean;
  onNext?: () => void;
}) {
  const { onboarding, nextStep, prevStep, skipOnboarding, isLoading } = useOnboarding();
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rubberband-dark to-rubberband-secondary p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {onboarding.step} of {onboarding.totalSteps}
            </span>
            {showSkipButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={skipOnboarding}
                disabled={isLoading}
              >
                Skip setup
              </Button>
            )}
          </div>
          
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mb-6">
            <div 
              className="bg-rubberband-primary h-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(onboarding.step / onboarding.totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          {children}
        </div>
        
        <div className="flex justify-between mt-8">
          {showBackButton && onboarding.step > 1 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
            >
              Back
            </Button>
          ) : <div />}
          
          {showNextButton && (
            <Button 
              onClick={handleNext}
              disabled={disableNextButton || isLoading}
            >
              {isLoading ? "Saving..." : nextButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
