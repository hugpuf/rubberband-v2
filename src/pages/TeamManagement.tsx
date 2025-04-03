
import { useState } from "react";
import { TeamList } from "@/components/teams/TeamList";
import { TeamDetails } from "@/components/teams/TeamDetails";
import { TeamMembers } from "@/components/teams/TeamMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTeams } from "@/hooks/useTeams";

const TeamManagement = () => {
  const { currentTeam } = useTeams();
  const [activeTab, setActiveTab] = useState("members");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-[#1C1C1E]">Team Management</h1>
        <p className="text-[#636366] mt-2 tracking-wide">
          Create and manage teams within your organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <TeamList />
        </div>
        
        <div className="md:col-span-2">
          {currentTeam ? (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-medium">{currentTeam.name}</h2>
                <p className="text-[#636366] text-sm">
                  {currentTeam.description || "No description provided"}
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 border border-dashed rounded-lg w-full">
                <h3 className="font-medium text-lg mb-1">No team selected</h3>
                <p className="text-muted-foreground">
                  Select a team from the list or create a new team to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
