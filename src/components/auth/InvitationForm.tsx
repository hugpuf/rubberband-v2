
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Storage bucket name for profile avatars
const STORAGE_BUCKET = 'profiles';

type InvitationFormProps = {
  email: string;
  orgName: string;
  role: string;
  invitationToken: string;
  isLoading: boolean;
};

export function InvitationForm({ email, orgName, role, invitationToken, isLoading }: InvitationFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getInitials = () => {
    const firstInitial = firstName.charAt(0);
    const lastInitial = lastName.charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    }
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: "First name is required",
        description: "Please enter your first name",
      });
      return false;
    }
    
    if (!lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Last name is required",
        description: "Please enter your last name",
      });
      return false;
    }
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password is required",
        description: "Please create a password",
      });
      return false;
    }
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      console.log("Step 1: Creating user account with email:", email);
      
      // Step 1: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      });
      
      if (authError) throw authError;
      
      console.log("Auth data received:", authData);
      const userId = authData.user?.id;
      
      if (!userId) {
        throw new Error("Failed to create user account");
      }

      console.log("Step 2: Ensuring profile exists for user:", userId);
      
      // Step 2: Make sure the profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileCheckError) {
        console.error("Error checking for existing profile:", profileCheckError);
      }
      
      if (!existingProfile) {
        console.log("Profile doesn't exist, creating one");
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          }]);
        
        if (createProfileError) {
          console.error("Error creating profile:", createProfileError);
          throw createProfileError;
        }
      } else {
        console.log("Profile exists, updating it");
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          })
          .eq('id', userId);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
          throw profileError;
        }
      }
      
      // Step 3: Upload avatar if provided
      if (avatarFile) {
        console.log("Step 3: Uploading avatar for user:", userId);
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, avatarFile, { upsert: true });
        
        if (uploadError) {
          console.error("Error uploading avatar:", uploadError);
          // Non-critical error, continue
        } else {
          // Get the public URL for the avatar
          const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);
          
          if (publicUrlData) {
            // Update user profile with avatar URL
            await supabase
              .from('profiles')
              .update({ avatar_url: publicUrlData.publicUrl })
              .eq('id', userId);
          }
        }
      }
      
      console.log("Step 4: Accepting invitation with token:", invitationToken);
      
      // Step 4: Accept the invitation
      const { data: acceptData, error: acceptError } = await supabase
        .rpc('accept_invitation', {
          token_param: invitationToken,
          user_id_param: userId,
        });
      
      if (acceptError) {
        console.error("Error accepting invitation:", acceptError);
        throw acceptError;
      }
      
      console.log("Invitation accepted:", acceptData);
      
      toast({
        title: "Account created!",
        description: `You've joined ${orgName} as a ${role}. Welcome!`,
      });
      
      // Sign in the user
      console.log("Step 5: Signing in the new user");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error("Error signing in:", signInError);
        throw signInError;
      }
      
      // Navigate to dashboard
      console.log("Success! Redirecting to dashboard");
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error("Error completing profile:", error);
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message || "Failed to create your account",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-semibold text-[#1C1C1E]">Create Your Profile</CardTitle>
        <CardDescription className="text-[#636366]">
          You've been invited to join <span className="font-medium">{orgName}</span> as a <span className="font-medium">{role}</span>
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg bg-gray-100 text-gray-600">
                  {firstName || lastName ? getInitials() : "?"}
                </AvatarFallback>
              </Avatar>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white border border-gray-200"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                +
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="border-gray-200 focus:border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="border-gray-200 focus:border-gray-300"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              className="bg-gray-100 border-gray-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-200 focus:border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-200 focus:border-gray-300"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-medium py-2 rounded-xl flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Create Account & Join
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
