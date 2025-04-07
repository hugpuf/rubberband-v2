
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

export function DangerZone() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { organization, organizationUsers } = useOrganization();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLastMember, setIsLastMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDeleteDialog = () => {
    // Check if user is the last member of the organization
    const isLast = organizationUsers && organizationUsers.length <= 1;
    setIsLastMember(isLast || false);
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    const expectedText = isLastMember ? organization?.name : "DELETE";
    
    if (confirmText !== expectedText) {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: `Please type ${expectedText} to confirm deletion.`,
      });
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Call our edge function to handle the deletion
      const { data, error } = await supabase.functions.invoke('delete-user-account');
      
      if (error) {
        console.error("Error deleting account:", error);
        setDeleteError(error.message || "Unknown error occurred during account deletion");
        throw error;
      }

      if (data?.error) {
        console.error("Function returned error:", data.error);
        setDeleteError(data.error || "Server returned an error during account deletion");
        throw new Error(data.error);
      }

      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });

      // Sign the user out
      await logout();
      
      // Redirect to home page
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "An error occurred while deleting your account.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader className="border-b border-destructive/20 text-destructive">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          Irreversible account actions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
      </CardContent>
      <CardFooter className="border-t border-destructive/20 pt-4">
        <Button 
          variant="destructive" 
          onClick={openDeleteDialog}
          className="flex items-center gap-2"
        >
          <Trash className="h-4 w-4" />
          Delete my account
        </Button>
      </CardFooter>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash className="h-5 w-5" />
              {isLastMember ? "Delete Entire Workspace" : "Delete Your Account"}
            </DialogTitle>
            <DialogDescription className="text-destructive/80">
              {isLastMember
                ? "You are the last member of this organization. Deleting your account will permanently delete the entire workspace and all its data."
                : "This will permanently delete your user account, profile and access to all organizations."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium">Warning: This action cannot be undone</p>
              </div>
              <p>
                {isLastMember 
                  ? `To verify, type "${organization?.name}" below`
                  : 'To verify, type "DELETE" below'}
              </p>
            </div>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={isLastMember ? organization?.name : "DELETE"}
              className="border-destructive/50 focus:border-destructive"
            />
            
            {deleteError && (
              <div className="mt-4 text-sm text-destructive bg-destructive/5 p-3 rounded-md">
                <p className="font-medium">Error: {deleteError}</p>
                <p className="mt-1">Please contact support if this issue persists.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting || confirmText !== (isLastMember ? organization?.name : "DELETE")}
              className="flex items-center gap-2"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
              {!isDeleting && <Trash className="h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
