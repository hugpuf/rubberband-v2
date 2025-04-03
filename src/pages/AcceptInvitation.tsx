
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface InvitationDetails {
  organization_name: string;
  email: string;
  role: string;
  valid: boolean;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [redirectToAuth, setRedirectToAuth] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  
  const token = searchParams.get("token");
  
  // Fetch invitation details
  useEffect(() => {
    const getInvitationDetails = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('validate_invitation_token', {
          token_param: token
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Invitation details:", data[0]);
          setInvitation(data[0] as any);
        } else {
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation link is invalid or has expired.",
          });
        }
      } catch (error: any) {
        console.error("Error validating invitation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to validate invitation: " + error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getInvitationDetails();
  }, [token]);
  
  // If user is already logged in, accept the invitation
  useEffect(() => {
    const acceptInvitation = async () => {
      if (!user || !token || !invitation || isAccepting) return;
      
      // If user's email doesn't match invitation email
      if (user.email !== invitation.email) {
        toast({
          variant: "destructive",
          title: "Email mismatch",
          description: `This invitation was sent to ${invitation.email} but you're logged in as ${user.email}. Please log in with the correct account.`,
        });
        return;
      }
      
      setIsAccepting(true);
      try {
        const { data, error } = await supabase.rpc('accept_invitation', {
          token_param: token,
          user_id_param: user.id
        });
        
        if (error) throw error;
        
        if (data) {
          toast({
            title: "Invitation accepted",
            description: `You've joined ${invitation.organization_name} as a ${invitation.role}`,
          });
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        } else {
          toast({
            variant: "destructive",
            title: "Failed to accept invitation",
            description: "There was an error accepting the invitation.",
          });
        }
      } catch (error: any) {
        console.error("Error accepting invitation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to accept invitation: " + error.message,
        });
      } finally {
        setIsAccepting(false);
      }
    };
    
    acceptInvitation();
  }, [user, token, invitation]);

  const handleSignIn = async () => {
    if (!invitation) return;
    setRedirectToAuth(true);
  };

  // Redirect to auth page with invitation email pre-filled
  if (redirectToAuth) {
    return <Navigate to={`/auth?email=${encodeURIComponent(invitation!.email)}&invitation=true`} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying invitation</CardTitle>
            <CardDescription>Please wait while we verify your invitation</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !invitation.valid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired. Please contact the organization admin for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation.organization_name}</strong> as a <strong>{invitation.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Email</p>
              <p className="text-sm">{invitation.email}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {user ? (
            <>
              {user.email === invitation.email ? (
                <Button disabled={isAccepting} className="w-full">
                  {isAccepting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {isAccepting ? "Accepting..." : "Accept Invitation"}
                </Button>
              ) : (
                <div className="text-center space-y-4 w-full">
                  <p className="text-sm text-destructive">
                    This invitation was sent to {invitation.email} but you're logged in as {user.email}.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = "/auth/logout"}>
                    Sign Out & Continue
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Button onClick={handleSignIn} className="w-full">
              Sign in to Accept
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
