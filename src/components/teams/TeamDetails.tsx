import { useState } from "react";
import { useTeams } from "@/hooks/teams";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash } from "lucide-react";

export function TeamDetails() {
  const { currentTeam, updateTeam, deleteTeam } = useTeams();
  const { isAdmin } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When current team changes, update the form values
  useState(() => {
    if (currentTeam) {
      setName(currentTeam.name);
      setDescription(currentTeam.description || "");
    }
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTeam) return;
    
    setIsSubmitting(true);
    await updateTeam(currentTeam.id, {
      name,
      description: description || null,
    });
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentTeam) return;
    await deleteTeam(currentTeam.id);
  };

  if (!currentTeam) {
    return null;
  }

  return (
    <Card>
      <form onSubmit={handleUpdate}>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Team Settings</CardTitle>
          <CardDescription>
            Manage team details and settings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            {isEditing ? (
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/30">
                {currentTeam.name}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            {isEditing ? (
              <Textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the team's purpose"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/30 min-h-[80px]">
                {currentTeam.description || "No description provided"}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {isAdmin && !isEditing ? (
            <>
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Team Details
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the team
                      and remove all members from it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : isEditing ? (
            <>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(currentTeam.name);
                  setDescription(currentTeam.description || "");
                }}
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
