
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("Loading user profile for:", user.id);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, avatar_url")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error loading profile:", error);
          throw error;
        }
        
        console.log("Profile data loaded:", data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setEmail(data.email || user.email || "");
        setAvatarUrl(data.avatar_url || null);
      } catch (error: any) {
        console.error("Error loading user profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your profile information",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, [user, toast]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSaving(true);
    console.log("Updating profile for user:", user.id);
    
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          updated_at: new Date().toISOString(), // Convert Date to ISO string
        })
        .eq("id", user.id);
        
      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }
      
      // Upload avatar if changed
      if (avatarFile) {
        console.log("Uploading new avatar");
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) {
          console.error("Error uploading avatar:", uploadError);
          throw uploadError;
        }
        
        // Get the public URL for the avatar
        const { data: publicUrlData } = supabase.storage
          .from("profiles")
          .getPublicUrl(filePath);
        
        if (publicUrlData) {
          console.log("Avatar uploaded, updating profile with URL:", publicUrlData.publicUrl);
          // Update user profile with avatar URL
          const { error: avatarError } = await supabase
            .from("profiles")
            .update({ avatar_url: publicUrlData.publicUrl })
            .eq("id", user.id);
            
          if (avatarError) {
            console.error("Error updating avatar URL:", avatarError);
            throw avatarError;
          }
        }
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update your profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Manage your personal profile information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => document.getElementById('profile-avatar-upload')?.click()}
              >
                +
              </Button>
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">First Name</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Last Name</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email Address</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-muted-foreground">
              Your email address cannot be changed
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="ml-auto"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
