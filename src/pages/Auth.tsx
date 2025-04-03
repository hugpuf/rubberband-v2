
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import OriginalAuth from "./Auth.original";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const invitationEmail = searchParams.get("email");
  const invitationToken = searchParams.get("token");
  const isInvitation = searchParams.get("invitation") === "true";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{
    valid: boolean;
    organization_name?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    // If we have an invitation token, validate it
    const validateInvitationToken = async () => {
      if (!invitationToken) return;
      
      setValidatingToken(true);
      try {
        console.log("Validating invitation token:", invitationToken);
        
        const { data, error } = await supabase
          .rpc('validate_invitation_token', { token_param: invitationToken });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const invitation = data[0];
          console.log("Invitation validation result:", invitation);
          
          setTokenValidation({
            valid: invitation.valid,
            organization_name: invitation.organization_name,
            role: invitation.role
          });
          
          if (invitation.valid) {
            toast({
              title: "Valid invitation",
              description: `You've been invited to join ${invitation.organization_name} as a ${invitation.role}`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Invalid invitation",
              description: "This invitation has expired or has already been used",
            });
          }
        } else {
          console.error("No data returned from invitation validation");
          setTokenValidation({ valid: false });
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation link is not valid",
          });
        }
      } catch (error: any) {
        console.error("Error validating invitation token:", error);
        setTokenValidation({ valid: false });
        toast({
          variant: "destructive",
          title: "Error validating invitation",
          description: error.message || "An error occurred validating your invitation",
        });
      } finally {
        setValidatingToken(false);
      }
    };

    if (isInvitation && invitationToken) {
      validateInvitationToken();
    }
  }, [invitationToken, isInvitation, toast]);

  // Automatically check auth status and redirect if logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Already logged in, redirect
        navigate('/dashboard');
      }
    };
    checkAuthStatus();
  }, [navigate]);

  return (
    <>
      {validatingToken ? (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Validating invitation</h2>
            <p className="text-gray-500">Please wait while we validate your invitation...</p>
          </div>
        </div>
      ) : (
        <OriginalAuth />
      )}
    </>
  );
};

export default Auth;
