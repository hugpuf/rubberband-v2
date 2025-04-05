
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/hooks/onboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Storage bucket name for profile avatars
const STORAGE_BUCKET = 'profiles';

export function PersonalDetailsStep() {
  const { onboarding, updatePersonalDetails } = useOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const { firstName, lastName, avatarUrl } = onboarding.personalDetails;
  
  const isFormValid = firstName.trim() !== '' && lastName.trim() !== '';
  
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;
      
      console.log("Uploading avatar to bucket:", STORAGE_BUCKET);
      
      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
        
      if (data) {
        updatePersonalDetails({ avatarUrl: data.publicUrl });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Error uploading avatar",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const getInitials = () => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return firstInitial + lastInitial || "?";
  };
  
  return (
    <OnboardingLayout
      showBackButton={false}
      disableNextButton={!isFormValid}
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Rubberband OS</h1>
          <p className="text-muted-foreground">Let's set up your profile</p>
        </div>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="text-lg bg-rubberband-primary text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <Label 
              htmlFor="avatar" 
              className="cursor-pointer text-sm text-rubberband-primary hover:underline"
            >
              {uploading ? "Uploading..." : "Upload profile picture"}
            </Label>
            <Input 
              id="avatar" 
              type="file" 
              accept="image/*" 
              onChange={uploadAvatar} 
              disabled={uploading}
              className="hidden" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName"
              value={firstName}
              onChange={(e) => updatePersonalDetails({ firstName: e.target.value })}
              placeholder="Enter your first name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName"
              value={lastName}
              onChange={(e) => updatePersonalDetails({ lastName: e.target.value })}
              placeholder="Enter your last name"
            />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
