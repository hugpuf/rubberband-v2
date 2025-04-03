
import { useOnboarding } from "@/hooks/onboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const USE_CASES = [
  {
    id: "sales",
    name: "Sales",
    description: "Track deals, manage pipeline, and forecast revenue"
  },
  {
    id: "cs",
    name: "Customer Success",
    description: "Monitor customer health and manage accounts"
  },
  {
    id: "hr",
    name: "Human Resources",
    description: "Streamline recruiting and employee management"
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Plan campaigns and track marketing performance"
  },
  {
    id: "product",
    name: "Product",
    description: "Track roadmap, features, and customer feedback"
  }
];

const BUSINESS_TYPES = [
  {
    id: "smb",
    name: "Small Business",
    description: "Less than 100 employees"
  },
  {
    id: "mid-market",
    name: "Mid-Market",
    description: "100-999 employees"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "1000+ employees"
  }
];

const WORKFLOW_STYLES = [
  {
    id: "product-led",
    name: "Product-Led",
    description: "Self-service with minimal sales touch"
  },
  {
    id: "sales-led",
    name: "Sales-Led",
    description: "High-touch sales approach"
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Combines product-led and sales approaches"
  }
];

export function UseCaseStep() {
  const { onboarding, updateUseCaseDetails } = useOnboarding();
  const { primaryUseCase, businessType, workflowStyle } = onboarding.useCaseDetails;
  
  const isFormValid = !!primaryUseCase && !!businessType && !!workflowStyle;
  
  return (
    <OnboardingLayout disableNextButton={!isFormValid}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Customize Your Experience</h1>
          <p className="text-muted-foreground">Help us tailor Rubberband to your needs</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">What's your primary use case?</Label>
            <RadioGroup
              value={primaryUseCase || ""}
              onValueChange={(value) => updateUseCaseDetails({ primaryUseCase: value })}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {USE_CASES.map((useCase) => (
                <Card 
                  key={useCase.id} 
                  className={`relative border flex items-center space-x-2 p-4 cursor-pointer transition-all ${
                    primaryUseCase === useCase.id 
                      ? "border-rubberband-primary bg-rubberband-primary/5"
                      : "hover:border-muted-foreground"
                  }`}
                  onClick={() => updateUseCaseDetails({ primaryUseCase: useCase.id })}
                >
                  <RadioGroupItem 
                    value={useCase.id}
                    id={`usecase-${useCase.id}`}
                    className="sr-only"
                  />
                  <div>
                    <Label 
                      htmlFor={`usecase-${useCase.id}`}
                      className="font-medium text-base cursor-pointer"
                    >
                      {useCase.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                </Card>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Business Size</Label>
            <RadioGroup
              value={businessType || ""}
              onValueChange={(value) => updateUseCaseDetails({ businessType: value })}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {BUSINESS_TYPES.map((type) => (
                <Card 
                  key={type.id} 
                  className={`relative border flex items-center space-x-2 p-4 cursor-pointer transition-all ${
                    businessType === type.id 
                      ? "border-rubberband-primary bg-rubberband-primary/5"
                      : "hover:border-muted-foreground"
                  }`}
                  onClick={() => updateUseCaseDetails({ businessType: type.id })}
                >
                  <RadioGroupItem 
                    value={type.id}
                    id={`biztype-${type.id}`}
                    className="sr-only"
                  />
                  <div>
                    <Label 
                      htmlFor={`biztype-${type.id}`}
                      className="font-medium text-base cursor-pointer"
                    >
                      {type.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </Card>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Workflow Style</Label>
            <RadioGroup
              value={workflowStyle || ""}
              onValueChange={(value) => updateUseCaseDetails({ workflowStyle: value })}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {WORKFLOW_STYLES.map((style) => (
                <Card 
                  key={style.id} 
                  className={`relative border flex items-center space-x-2 p-4 cursor-pointer transition-all ${
                    workflowStyle === style.id 
                      ? "border-rubberband-primary bg-rubberband-primary/5"
                      : "hover:border-muted-foreground"
                  }`}
                  onClick={() => updateUseCaseDetails({ workflowStyle: style.id })}
                >
                  <RadioGroupItem 
                    value={style.id}
                    id={`workflow-${style.id}`}
                    className="sr-only"
                  />
                  <div>
                    <Label 
                      htmlFor={`workflow-${style.id}`}
                      className="font-medium text-base cursor-pointer"
                    >
                      {style.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                </Card>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
