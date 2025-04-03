import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/onboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { Mail, Calendar, Cloud, Check } from "lucide-react";

export function IntegrationsStep() {
  const { onboarding, connectIntegration } = useOnboarding();
  const { googleConnected, microsoftConnected } = onboarding.integrations;
  
  const connectGoogle = async () => {
    // This would normally redirect to OAuth flow
    // For now, we'll simulate a successful connection
    connectIntegration("google", true);
  };
  
  const disconnectGoogle = () => {
    connectIntegration("google", false);
  };
  
  const connectMicrosoft = async () => {
    // This would normally redirect to OAuth flow
    // For now, we'll simulate a successful connection
    connectIntegration("microsoft", true);
  };
  
  const disconnectMicrosoft = () => {
    connectIntegration("microsoft", false);
  };
  
  return (
    <OnboardingLayout 
      showSkipButton={true}
      nextButtonText="Continue"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Connect Your Tools</h1>
          <p className="text-muted-foreground">Connect your email and calendar for better collaboration</p>
        </div>
        
        <div className="space-y-4 py-4">
          <div className="border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl text-blue-500">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">Google Workspace</h3>
                  <p className="text-sm text-muted-foreground">Connect Gmail, Calendar, and Drive</p>
                </div>
              </div>
              
              {googleConnected ? (
                <Button variant="outline" onClick={disconnectGoogle}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connectGoogle}>
                  Connect
                </Button>
              )}
            </div>
            
            {googleConnected && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-3 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2" />
                <span>Successfully connected to Google Workspace</span>
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl text-blue-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">Microsoft 365</h3>
                  <p className="text-sm text-muted-foreground">Connect Outlook, Calendar, and OneDrive</p>
                </div>
              </div>
              
              {microsoftConnected ? (
                <Button variant="outline" onClick={disconnectMicrosoft}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connectMicrosoft}>
                  Connect
                </Button>
              )}
            </div>
            
            {microsoftConnected && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-3 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2" />
                <span>Successfully connected to Microsoft 365</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Don't see your tools? Don't worry, you can connect more integrations later.</p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
