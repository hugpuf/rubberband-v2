
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboarding } from "@/hooks/onboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  "United States",
  "United Kingdom", 
  "Canada", 
  "Australia", 
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "South Africa",
  "Other"
];

const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Friend or Colleague",
  "Blog or Article", 
  "Online Advertisement",
  "Conference or Event",
  "Email Newsletter",
  "Other"
];

export function CompanyDetailsStep() {
  const { onboarding, updateOrganizationDetails } = useOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  
  const { name, workspaceHandle, logoUrl, country, referralSource } = onboarding.organizationDetails;
  
  const isFormValid = 
    name.trim() !== '' && 
    workspaceHandle.trim() !== '' && 
    handleAvailable === true && 
    country !== '';
  
  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `org-${Math.random()}.${fileExt}`;
      
      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      if (data) {
        updateOrganizationDetails({ logoUrl: data.publicUrl });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Error uploading logo",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const checkHandleAvailability = async (handle: string) => {
    if (!handle.trim()) {
      setHandleAvailable(null);
      return;
    }
    
    try {
      setCheckingHandle(true);
      
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_handle', handle);
        
      if (error) throw error;
      
      setHandleAvailable(count === 0);
    } catch (error) {
      console.error("Error checking handle:", error);
      // Default to available in case of error
      setHandleAvailable(true);
    } finally {
      setCheckingHandle(false);
    }
  };
  
  const handleHandleChange = (value: string) => {
    // Format handle: lowercase, no spaces, only alphanumeric and hyphens
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateOrganizationDetails({ workspaceHandle: formatted });
    checkHandleAvailability(formatted);
  };
  
  return (
    <OnboardingLayout disableNextButton={!isFormValid}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Company Details</h1>
          <p className="text-muted-foreground">Tell us about your organization</p>
        </div>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={logoUrl || undefined} alt="Company Logo" />
            <AvatarFallback className="text-lg bg-gray-200 text-gray-500">
              {name.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <Label 
              htmlFor="logo" 
              className="cursor-pointer text-sm text-rubberband-primary hover:underline"
            >
              {uploading ? "Uploading..." : "Upload company logo"}
            </Label>
            <Input 
              id="logo" 
              type="file" 
              accept="image/*" 
              onChange={uploadLogo} 
              disabled={uploading}
              className="hidden" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input 
              id="companyName"
              value={name}
              onChange={(e) => updateOrganizationDetails({ name: e.target.value })}
              placeholder="Enter your company name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workspaceHandle">Workspace URL</Label>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">rubberband.os/</span>
              <div className="flex-1 relative">
                <Input 
                  id="workspaceHandle"
                  value={workspaceHandle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder="your-company"
                  className={
                    handleAvailable === true
                      ? "pr-10 border-green-500 focus-visible:ring-green-500"
                      : handleAvailable === false
                        ? "pr-10 border-red-500 focus-visible:ring-red-500"
                        : "pr-10"
                  }
                />
                {checkingHandle && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-rubberband-primary rounded-full border-t-transparent" />
                  </div>
                )}
                {!checkingHandle && handleAvailable === true && workspaceHandle && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    ✓
                  </div>
                )}
                {!checkingHandle && handleAvailable === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                    ✗
                  </div>
                )}
              </div>
            </div>
            {handleAvailable === false && (
              <span className="text-sm text-red-500">
                This workspace URL is already taken.
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              value={country}
              onValueChange={(value) => updateOrganizationDetails({ country: value })}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralSource">How did you hear about us?</Label>
            <Select 
              value={referralSource || ""}
              onValueChange={(value) => 
                updateOrganizationDetails({ referralSource: value || null })
              }
            >
              <SelectTrigger id="referralSource">
                <SelectValue placeholder="Select source (optional)" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
