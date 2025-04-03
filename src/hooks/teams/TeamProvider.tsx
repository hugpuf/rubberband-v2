import { useState, useEffect, useRef } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { TeamContext } from "./teamContext";
import { Team, TeamMember, TeamProviderProps } from "./types";
import {
  fetchTeams,
  fetchTeamMembers,
  createNewTeam,
  updateTeamDetails,
  deleteTeamById,
  addMemberToTeam,
  updateMemberRole,
  removeMemberFromTeam
} from "./teamOperations";

export function TeamProvider({ children }: TeamProviderProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState<boolean>(false);
  const isRefreshing = useRef(false);

  // Fetch teams for the current organization
  const refreshTeams = async () => {
    if (!organization || isRefreshing.current) {
      console.log("Skipping team refresh - no organization or already refreshing");
      setTeams([]);
      setIsLoading(false);
      return;
    }
    
    console.log("Refreshing teams for organization:", organization.id);
    setIsLoading(true);
    setIsError(false);
    isRefreshing.current = true;
    
    try {
      const data = await fetchTeams(organization.id);
      console.log("Teams refreshed:", data);
      setTeams(data || []);
      
      // If a current team is set, refresh its data
      if (currentTeam) {
        const updatedTeam = data?.find(team => team.id === currentTeam.id);
        if (updatedTeam) {
          setCurrentTeam(updatedTeam);
          await refreshTeamMembers(updatedTeam.id);
        } else {
          setCurrentTeam(null);
          setTeamMembers(null);
        }
      }
    } catch (error: any) {
      console.error("Error refreshing teams:", error);
      setIsError(true);
      setTeams([]); // Set to empty array on error to prevent loading state
      toast({
        variant: "destructive",
        title: "Failed to load teams",
        description: "Network error or permissions issue. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
      isRefreshing.current = false;
    }
  };

  // Fetch team members for a specific team
  const refreshTeamMembers = async (teamId: string) => {
    if (!teamId) return;
    
    setIsLoading(true);
    
    try {
      const data = await fetchTeamMembers(teamId);
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
      toast({
        variant: "destructive",
        title: "Failed to load team members",
        description: "Network error or permissions issue. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Select a team to set as current
  const selectTeam = async (teamId: string) => {
    if (!teams) return;
    
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      await refreshTeamMembers(teamId);
    }
  };

  // Create a new team
  const createTeam = async (name: string, description?: string): Promise<Team | null> => {
    if (!organization) return null;
    
    try {
      const newTeam = await createNewTeam(name, description, organization.id);
      
      // Update teams list without full refresh
      setTeams(prev => prev ? [...prev, newTeam] : [newTeam]);
      
      toast({
        title: "Team created",
        description: `Team "${name}" has been created successfully.`,
      });
      
      return newTeam;
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({
        variant: "destructive",
        title: "Failed to create team",
        description: error.message,
      });
      return null;
    }
  };

  // Update team details
  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      await updateTeamDetails(teamId, updates);
      
      // Refresh teams list
      await refreshTeams();
      
      toast({
        title: "Team updated",
        description: "Team details have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating team:", error);
      toast({
        variant: "destructive",
        title: "Failed to update team",
        description: error.message,
      });
    }
  };

  // Delete a team
  const deleteTeam = async (teamId: string) => {
    try {
      await deleteTeamById(teamId);
      
      // If current team is deleted, reset current team
      if (currentTeam?.id === teamId) {
        setCurrentTeam(null);
        setTeamMembers(null);
      }
      
      // Refresh teams list
      await refreshTeams();
      
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete team",
        description: error.message,
      });
    }
  };

  // Add a member to the team
  const addTeamMember = async (teamId: string, email: string, role: TeamMember['role']) => {
    try {
      await addMemberToTeam(teamId, email, role);
      
      // Refresh team members
      await refreshTeamMembers(teamId);
      
      toast({
        title: "Team member added",
        description: `${email} has been added to the team.`,
      });
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast({
        variant: "destructive",
        title: "Failed to add team member",
        description: error.message,
      });
    }
  };

  // Update a team member's role
  const updateTeamMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
    try {
      await updateMemberRole(memberId, newRole);
      
      // Refresh team members if current team is set
      if (currentTeam) {
        await refreshTeamMembers(currentTeam.id);
      }
      
      toast({
        title: "Role updated",
        description: "Team member's role has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating team member role:", error);
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message,
      });
    }
  };

  // Remove a member from the team
  const removeTeamMember = async (memberId: string) => {
    try {
      await removeMemberFromTeam(memberId);
      
      // Refresh team members if current team is set
      if (currentTeam) {
        await refreshTeamMembers(currentTeam.id);
      }
      
      toast({
        title: "Team member removed",
        description: "User has been removed from the team.",
      });
    } catch (error: any) {
      console.error("Error removing team member:", error);
      toast({
        variant: "destructive",
        title: "Failed to remove team member",
        description: error.message,
      });
    }
  };

  // Load teams when organization changes or on component mount
  useEffect(() => {
    if (organization && !hasAttemptedFetch && !isRefreshing.current) {
      console.log("Organization available, fetching teams for:", organization.id);
      refreshTeams();
    } else if (!organization) {
      console.log("No organization available, resetting teams data");
      setTeams([]);
      setCurrentTeam(null);
      setTeamMembers(null);
      setIsLoading(false);
    }
  }, [organization, hasAttemptedFetch]);

  const contextValue = {
    teams,
    currentTeam,
    teamMembers,
    isLoading,
    isError,
    refreshTeams,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
}
