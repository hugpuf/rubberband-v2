
import { useState } from "react";
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
import {
  UserPlus,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  Users,
} from "lucide-react";

export function UsersList() {
  const { organizationUsers, isAdmin, inviteUser, updateUserRole, removeUser } = useOrganization();
  const { toast } = useToast();

  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("viewer");
  const [expiryHours, setExpiryHours] = useState(48);

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

  const handleInviteUser = async () => {
    if (!newUserEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email is required",
      });
      return;
    }

    await inviteUser(newUserEmail, newUserRole, expiryHours);
    setInviteDialogOpen(false);
    setNewUserEmail("");
    setNewUserRole("viewer");
    setExpiryHours(48);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
  };

  const handleRemoveUser = async (userId: string) => {
    await removeUser(userId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Users</CardTitle>
        {isAdmin && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
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
                  className="flex items-center gap-2"
                  onClick={handleInviteUser}
                >
                  <UserPlus className="h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isAdmin && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizationUsers?.map((user: any) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.profiles?.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </div>
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
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, "admin")}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, "manager")}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Make Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, "viewer")}
                        >
                          <ShieldQuestion className="mr-2 h-4 w-4" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveUser(user.user_id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
