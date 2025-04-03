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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTeams } from "@/hooks/useTeams";

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
      // Check if user already exists in profiles
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newUserEmail)
        .maybeSingle();
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);
      
      // Generate a token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
        
      if (tokenError) throw tokenError;
      
      // Create invitation
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

      // Send invitation email via edge function
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
          } else {
            console.log("Email function response:", emailResult);
          }
        } catch (emailError) {
          console.error("Error calling send-invitation-email function:", emailError);
        }
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${newUserEmail}`,
      });
      
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
      // Update expiry date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      // Generate a new token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
        
      if (tokenError) throw tokenError;
      
      // Update invitation
      const { error } = await supabase
        .from("invitations")
        .update({
          token: tokenData,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .eq("id", invitation.id);

      if (error) throw error;

      // Resend invitation email
      try {
        await supabase.functions.invoke(
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
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
      }

      toast({
        title: "Invitation resent",
        description: `Invitation resent to ${invitation.email}`,
      });
      
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
