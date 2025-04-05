
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          variant: "destructive",
          title: "Invalid invitation link",
          description: "No invitation token provided"
        });
        navigate("/auth");
        return;
      }

      try {
        setValidating(true);
        console.log("Validating invitation token:", token);
        
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.log("No authenticated user, redirecting to create profile");
          // Redirect to create profile with the invitation token
          navigate(`/create-profile?token=${token}`);
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
          navigate("/dashboard");
          return;
        }

        setInvitation(data[0]);
        
        // Check if the user's email matches the invitation email
        const user = sessionData.session.user;
        console.log("Comparing emails:", user.email, data[0].email);
        
        if (user.email !== data[0].email) {
          toast({
            variant: "destructive",
            title: "Email mismatch",
            description: `This invitation was sent to ${data[0].email}, but you're logged in as ${user.email}`
          });
          navigate("/dashboard");
          return;
        }
        
      } catch (error: any) {
        console.error("Error validating invitation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An error occurred validating your invitation"
        });
      } finally {
        setValidating(false);
        setLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleAcceptInvitation = async () => {
    if (!token || !invitation) return;

    try {
      setAccepting(true);
      console.log("Accepting invitation with token:", token);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("No authenticated user found");
      }

      console.log("Current user:", userData.user.id);

      // Accept the invitation
      const { data, error } = await supabase
        .rpc('accept_invitation', {
          token_param: token,
          user_id_param: userData.user.id
        });

      if (error) {
        console.error("Error accepting invitation:", error);
        throw error;
      }

      console.log("Invitation acceptance result:", data);
      
      if (!data) {
        throw new Error("Failed to accept invitation");
      }

      toast({
        title: "Invitation accepted",
        description: `You've joined ${invitation.organization_name}`
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred accepting your invitation"
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Processing Invitation</CardTitle>
            <CardDescription>
              Please wait while we validate your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating || !invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-1">
              You've been invited to join
            </h3>
            <p className="text-2xl font-bold">{invitation.organization_name}</p>
          </div>
          <div className="mb-6">
            <p className="text-muted-foreground">
              You'll be added as a <span className="font-medium">{invitation.role}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleDecline}
            disabled={accepting}
          >
            Decline
          </Button>
          <Button 
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="flex items-center gap-2"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
