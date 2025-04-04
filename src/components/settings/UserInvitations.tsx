import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  MailOpen,
  RefreshCcw,
  Copy,
  AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTeams } from "@/hooks/useTeams";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UserInvitations() {
  const { organization, isAdmin } = useOrganization();
  const { teams } = useTeams();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("viewer");
  const [expiryHours, setExpiryHours] = useState(48);
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [emailServiceConfigured, setEmailServiceConfigured] = useState(true);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "manager":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case "viewer":
        return <ShieldQuestion className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const fetchInvitations = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invitations",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organization) {
      fetchInvitations();
    }
  }, [organization]);

  const sendInvitation = async () => {
    if (!organization || !newUserEmail) return;
    
    setSendingInvite(true);

    try {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newUserEmail)
        .maybeSingle();
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);
      
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
        
      if (tokenError) throw tokenError;
      
      const { data: inviteData, error: inviteError } = await supabase
        .from("invitations")
        .insert([
          {
            organization_id: organization.id,
            email: newUserEmail,
            role: newUserRole,
            invited_by: (await supabase.auth.getUser()).data.user?.id,
            token: tokenData,
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select();

      if (inviteError) {
        if (inviteError.code === '23505') {
          throw new Error("An invitation for this email already exists");
        }
        throw inviteError;
      }

      if (inviteData && inviteData.length > 0) {
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke(
            "send-invitation-email", 
            {
              body: {
                invitation_id: inviteData[0].id,
                organization_name: organization.name,
                email: newUserEmail,
                token: tokenData,
                role: newUserRole
              }
            }
          );
          
          if (emailError) {
            console.error("Error sending invitation email:", emailError);
            toast({
              variant: "destructive",
              title: "Email delivery failed",
              description: "Invitation created, but the email could not be sent. User can still access via the invitation link.",
            });
          } else {
            console.log("Email function response:", emailResult);
            
            if (emailResult && emailResult.message === "Email service not configured. RESEND_API_KEY is missing.") {
              setEmailServiceConfigured(false);
              toast({
                variant: "destructive",
                title: "Email service not configured",
                description: "The invitation was created but emails cannot be sent. Please configure Resend API key.",
              });
            } else {
              toast({
                title: "Invitation sent",
                description: `Invitation sent to ${newUserEmail}`,
              });
            }
          }
        } catch (emailError) {
          console.error("Error calling send-invitation-email function:", emailError);
          toast({
            variant: "destructive",
            title: "Email delivery failed",
            description: "Invitation created, but there was an error sending the email.",
          });
        }
      }
      
      await fetchInvitations();
      setInviteDialogOpen(false);
      setNewUserEmail("");
      setNewUserRole("viewer");
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const resendInvitation = async (invitation: any) => {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
        
      if (tokenError) throw tokenError;
      
      const { error } = await supabase
        .from("invitations")
        .update({
          token: tokenData,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .eq("id", invitation.id);

      if (error) throw error;

      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          "send-invitation-email", 
          {
            body: {
              invitation_id: invitation.id,
              organization_name: organization?.name || "",
              email: invitation.email,
              token: tokenData,
              role: invitation.role
            }
          }
        );
        
        if (emailError) {
          throw emailError;
        }
        
        if (emailResult && emailResult.message === "Email service not configured. RESEND_API_KEY is missing.") {
          setEmailServiceConfigured(false);
          toast({
            variant: "destructive",
            title: "Email service not configured",
            description: "The invitation was refreshed but emails cannot be sent. Please configure Resend API key.",
          });
        } else {
          toast({
            title: "Invitation resent",
            description: `Invitation resent to ${invitation.email}`,
          });
        }
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        toast({
          variant: "destructive",
          title: "Email delivery failed",
          description: "Invitation was refreshed, but the email could not be sent.",
        });
      }
      
      await fetchInvitations();
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend invitation",
      });
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation deleted",
        description: "The invitation has been deleted",
      });
      
      await fetchInvitations();
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete invitation",
      });
    }
  };

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const invitationLink = `${baseUrl}/auth?invitation=true&token=${token}`;
    navigator.clipboard.writeText(invitationLink);
    
    toast({
      title: "Link copied",
      description: "Invitation link copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Invitations</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchInvitations}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                New Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite a new user</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              
              {!emailServiceConfigured && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Email Service Not Configured</AlertTitle>
                  <AlertDescription>
                    The email service is not properly configured. Invitations will be created but emails won't be sent. 
                    You can still copy and share invitation links manually.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={setNewUserRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <ShieldQuestion className="h-4 w-4" />
                          Viewer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryHours">Invitation expires in</Label>
                  <Select
                    value={expiryHours.toString()}
                    onValueChange={(value) => setExpiryHours(Number(value))}
                  >
                    <SelectTrigger id="expiryHours">
                      <SelectValue placeholder="Select expiry time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={sendInvitation}
                  disabled={sendingInvite || !newUserEmail}
                  className="flex items-center gap-2"
                >
                  {sendingInvite ? (
                    <>
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailOpen className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!emailServiceConfigured && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email Service Not Configured</AlertTitle>
            <AlertDescription>
              The email service is not properly configured. You need to add the RESEND_API_KEY in Supabase Edge Functions settings.
              In the meantime, you can manually copy and share invitation links.
            </AlertDescription>
          </Alert>
        )}
      
        {loading ? (
          <div className="text-center py-4">Loading invitations...</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-4">No pending invitations</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize ${
                      invitation.status === "accepted" ? "text-green-600" : 
                      invitation.status === "pending" ? "text-amber-600" : 
                      "text-red-600"
                    }`}>
                      {invitation.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span title={format(new Date(invitation.expires_at), "PPpp")}>
                      {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyInvitationLink(invitation.token)}
                        title="Copy invitation link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInvitation(invitation)}
                        disabled={invitation.status !== "pending"}
                        title="Resend invitation"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInvitation(invitation.id)}
                        title="Delete invitation"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
