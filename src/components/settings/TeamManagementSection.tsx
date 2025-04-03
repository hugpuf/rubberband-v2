
import { useTeams } from "@/hooks/useTeams";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, PlusCircle, Loader2 } from "lucide-react";
import { TeamList } from "@/components/teams/TeamList";
import { TeamDetails } from "@/components/teams/TeamDetails";
import { TeamMembers } from "@/components/teams/TeamMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TeamManagementSection() {
  const { teams, currentTeam, createTeam, refreshTeams, isLoading } = useTeams();
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [activeTeamTab, setActiveTeamTab] = useState("members");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Make sure teams are loaded when the component mounts
  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Team name is required",
      });
      return;
    }

    setIsSubmitting(true);
    const newTeam = await createTeam(teamName, teamDescription);
    setIsSubmitting(false);
    
    if (newTeam) {
      toast({
        title: "Team created",
        description: `Team "${teamName}" has been created`,
      });
      setCreateDialogOpen(false);
      setTeamName("");
      setTeamDescription("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-medium text-lg">Teams</h3>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
              <DialogDescription>
                Create a team to group users with similar roles and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team name</Label>
                <Input
                  id="name"
                  placeholder="Engineering, Marketing, etc."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the team's purpose or focus"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateTeam}
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Select a team to manage its members and settings</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TeamList />
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {currentTeam ? (
            <Card>
              <CardHeader>
                <CardTitle>{currentTeam.name}</CardTitle>
                {currentTeam.description && (
                  <CardDescription>{currentTeam.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Tabs value={activeTeamTab} onValueChange={setActiveTeamTab} className="w-full">
                  <TabsList className="mb-4 bg-[#F5F5F7] p-1 rounded-lg">
                    <TabsTrigger
                      value="members"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
                    >
                      Members
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
                    >
                      Settings
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="members">
                    <TeamMembers />
                  </TabsContent>
                  <TabsContent value="settings">
                    <TeamDetails />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="w-full">
                <CardContent className="text-center p-8">
                  <h3 className="font-medium text-lg mb-1">No team selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a team from the list or create a new team to get started.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Team
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
