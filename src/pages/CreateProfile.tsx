
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InvitationForm } from "@/components/auth/InvitationForm";
import { Loader2 } from "lucide-react";

// Storage bucket name for profile avatars
const STORAGE_BUCKET = 'profiles';

const CreateProfile = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          variant: "destructive",
          title: "Missing invitation token",
          description: "No invitation token was provided"
        });
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        console.log("Validating invitation token:", token);
        
        // Check if user is already authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log("User is already logged in, redirecting to accept invitation page");
          // User is already logged in, redirect to accept invitation page
          navigate(`/accept-invitation?token=${token}`);
          return;
        }

        // Validate the token
        const { data, error } = await supabase
          .rpc('validate_invitation_token', { token_param: token });

        if (error) {
          console.error("Error validating token:", error);
          throw error;
        }

        console.log("Invitation validation result:", data);
        
        if (!data || data.length === 0 || !data[0].valid) {
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation has expired or has already been used"
          });
          navigate("/auth");
          return;
        }

        setInvitation(data[0]);
        
      } catch (error: any) {
        console.error("Error validating invitation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An error occurred validating your invitation"
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Validating invitation</h2>
          <p className="text-gray-500">Please wait while we validate your invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <InvitationForm 
        email={invitation.email}
        orgName={invitation.organization_name}
        role={invitation.role}
        invitationToken={token || ""}
        isLoading={false}
        storageBucket={STORAGE_BUCKET}
      />
    </div>
  );
};

export default CreateProfile;
