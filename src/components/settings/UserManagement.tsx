
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Loader2,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { logUserAction } from "@/services/userLogs";

const roles = [
  {
    label: "Admin",
    value: "admin",
  },
  {
    label: "Member",
    value: "member",
  },
];

const inviteFormSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export const UserManagement = () => {
  const { toast } = useToast();
  const { organization, isAdmin, inviteUser, updateUserRole, removeUser, organizationUsers } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const handleInviteUser = async (data: z.infer<typeof inviteFormSchema>) => {
    setIsSubmitting(true);
    try {
      await inviteUser(data.email, data.role);
      
      // Log the user invitation
      logUserAction({
        module: "User Management",
        action: "invite",
        metadata: { 
          email: data.email,
          role: data.role
        }
      });
      
      form.reset();
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to invite user"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole as "admin" | "member");
      
      // Log the role update
      logUserAction({
        module: "User Management",
        action: "update",
        recordId: userId,
        metadata: { 
          userId,
          newRole
        }
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user role"
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
      
      // Log the user removal
      logUserAction({
        module: "User Management",
        action: "delete",
        recordId: userId,
        metadata: { userId }
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove user"
      });
    }
  };

  const isLoading = !organizationUsers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite a new user</DialogTitle>
              <DialogDescription>
                Enter the user's email address to send them an invitation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleInviteUser)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  {...form.register("email")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value: "admin" | "member") => form.setValue("role", value)}
                  defaultValue={form.getValues("role")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invite user
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of users in your organization.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizationUsers?.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">{user.profiles.full_name}</TableCell>
                <TableCell>{user.profiles.email}</TableCell>
                <TableCell>
                  <Select
                    onValueChange={async (value) => {
                      await handleUpdateUserRole(user.user_id, value);
                    }}
                    defaultValue={user.role}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await handleRemoveUser(user.user_id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">{organizationUsers?.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};
