
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganization } from "@/hooks/useOrganization";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function OrgLogoUpload() {
  const { organization, refreshOrganization, updateOrganization, isAdmin } = useOrganization();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const orgInitials = organization?.name?.substring(0, 2).toUpperCase() || "RB";

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    // Validate file type
    const fileExt = file.name.split('.').pop();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
    const isAllowedType = allowedTypes.includes((fileExt || '').toLowerCase());

    if (!isAllowedType) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a valid image file (JPG, PNG, GIF, or SVG)."
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Logo image must be less than 2MB."
      });
      return;
    }

    try {
      setIsUploading(true);

      // Generate a unique file name
      const fileName = `${organization.id}.${fileExt}`;
      const filePath = `organizations/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update organization with logo URL
      await updateOrganization({
        logo_url: urlData.publicUrl
      });

      // Refresh organization data
      await refreshOrganization();

      toast({
        title: "Logo updated",
        description: "Your organization logo has been updated successfully."
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Could not upload logo. Please try again."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization || !organization.logo_url) return;

    try {
      setIsRemoving(true);

      // Extract file path from URL
      const urlParts = organization.logo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `organizations/${fileName}`;

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (deleteError) {
        console.error("Error deleting logo file:", deleteError);
        // Continue anyway to update the database
      }

      // Update organization to remove logo reference
      await updateOrganization({
        logo_url: null
      });

      // Refresh organization data
      await refreshOrganization();

      toast({
        title: "Logo removed",
        description: "Your organization logo has been removed."
      });
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not remove logo. Please try again."
      });
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={organization?.logo_url || ""} alt="Organization Logo" />
          <AvatarFallback className="bg-gray-50 text-gray-600 text-xl font-medium">
            {orgInitials}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm text-gray-500">
          Only administrators can change the organization logo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={organization?.logo_url || ""} alt="Organization Logo" />
          <AvatarFallback className="bg-gray-50 text-gray-600 text-xl font-medium">
            {orgInitials}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">
            Upload a logo for your organization. This will appear in the sidebar and other places.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading || isRemoving}
              className="relative"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleLogoUpload}
                disabled={isUploading || isRemoving}
              />
            </Button>
            
            {organization?.logo_url && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleRemoveLogo}
                disabled={isUploading || isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Remove Logo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
