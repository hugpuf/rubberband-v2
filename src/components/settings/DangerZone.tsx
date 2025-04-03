
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DangerZone() {
  const { user } = useAuth();
  const { organization, organizationUsers, isAdmin } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  
  // Determine if this is the last user in the organization
  const isLastMember = organizationUsers?.length === 1;
  const confirmationText = isLastMember 
    ? organization?.name 
    : "DELETE MY ACCOUNT";
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Call dedicated function for account deletion
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { isLastMember },
      });
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Account deleted",
        description: isLastMember 
          ? "Your workspace and all data has been deleted." 
          : "Your account has been removed from this workspace.",
      });
      
      // Sign out and redirect to landing page
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error?.message || "Could not delete your account. Please try again.",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 border rounded-lg p-6 bg-red-50/50">
      <div className="flex flex-row items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
      </div>
      
      <Separator className="bg-red-200" />
      
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Action</AlertTitle>
          <AlertDescription>
            {isLastMember
              ? "You are the last member of this workspace. Deleting your account will permanently delete all workspace data."
              : "Deleting your account will remove you from this workspace and delete your associated data."}
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteConfirmation(true)}
        >
          Delete my account
        </Button>
      </div>
      
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {isLastMember 
                ? "Delete entire workspace" 
                : "Delete your account"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {isLastMember ? (
                <>
                  <p>
                    You are the last member of <strong>{organization?.name}</strong>. 
                    This action will permanently delete:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Your entire workspace and organization data</li>
                    <li>All settings and configurations</li>
                    <li>All integrations and connected services</li>
                    <li>Your user account and profile</li>
                  </ul>
                  <p className="font-semibold">
                    To confirm, please type <strong>{organization?.name}</strong> below:
                  </p>
                </>
              ) : (
                <>
                  <p>This action will permanently delete:</p>
                  <ul className="list-disc pl-6">
                    <li>Your user account and profile from this organization</li>
                    <li>Your role assignments in this workspace</li>
                    <li>Any personal settings or integrations</li>
                  </ul>
                  <p>
                    The organization and other members will not be affected.
                  </p>
                  <p className="font-semibold">
                    To confirm, please type <strong>DELETE MY ACCOUNT</strong> below:
                  </p>
                </>
              )}
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={
                  confirmText === confirmationText
                    ? "border-green-500 focus:border-green-500"
                    : "border-red-200 focus:border-red-500"
                }
                placeholder={`Type ${confirmationText} here`}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmText !== confirmationText || isLoading}
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading
                ? "Deleting..."
                : isLastMember
                ? "Delete entire workspace"
                : "Delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
