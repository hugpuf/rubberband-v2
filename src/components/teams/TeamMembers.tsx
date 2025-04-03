
import { useState } from "react";
import { useTeams, TeamMember } from "@/hooks/useTeams";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserPlus, MoreVertical, Loader2, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TeamMembers() {
  const { currentTeam, teamMembers, isLoading, addTeamMember, updateTeamMemberRole, removeTeamMember } = useTeams();
  const { isAdmin } = useOrganization();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMember["role"]>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim() || !currentTeam) return;
    
    setIsSubmitting(true);
    await addTeamMember(currentTeam.id, newMemberEmail, newMemberRole);
    setIsSubmitting(false);
    
    // Reset form and close dialog
    setNewMemberEmail("");
    setNewMemberRole("viewer");
    setIsDialogOpen(false);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      await removeTeamMember(memberToRemove.id);
      setMemberToRemove(null);
      setIsRemoveDialogOpen(false);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const confirmRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  const handleRoleChange = async (memberId: string, newRole: TeamMember["role"]) => {
    await updateTeamMemberRole(memberId, newRole);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "contributor": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  if (!currentTeam) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <h3 className="font-medium text-lg mb-1">No team selected</h3>
        <p className="text-muted-foreground mb-4">
          Select a team to view and manage its members.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Team Members</h2>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Team Members</h2>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddMember}>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add a user to the team by their email address.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newMemberRole}
                      onValueChange={(value) => setNewMemberRole(value as TeamMember["role"])}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {newMemberRole === "admin" && "Can manage team settings, members, and all team resources."}
                      {newMemberRole === "manager" && "Can manage team resources and some team settings."}
                      {newMemberRole === "contributor" && "Can create and edit team resources."}
                      {newMemberRole === "viewer" && "Can view team resources but cannot edit."}
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {teamMembers && teamMembers.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {getInitials(member.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.profiles?.full_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value as TeamMember["role"])}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="contributor">Contributor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role) as any}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => confirmRemoveMember(member)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <UserPlus className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium text-lg mb-1">No team members yet</h3>
          <p className="text-muted-foreground mb-4">
            Add members to this team to collaborate together.
          </p>
          {isAdmin && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Team Member
            </Button>
          )}
        </div>
      )}
      
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.profiles?.full_name || memberToRemove?.profiles?.email || 'this user'} from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
