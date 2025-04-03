
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";

// Types
export type Team = {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'contributor' | 'viewer';
  profiles: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  }
};

type TeamContextType = {
  teams: Team[] | null;
  currentTeam: Team | null;
  teamMembers: TeamMember[] | null;
  isLoading: boolean;
  isError: boolean;
  refreshTeams: () => Promise<void>;
  selectTeam: (teamId: string) => void;
  createTeam: (name: string, description?: string) => Promise<Team | null>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, email: string, role: TeamMember['role']) => Promise<void>;
  updateTeamMemberRole: (memberId: string, newRole: TeamMember['role']) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Fetch teams for the current organization
  const fetchTeams = async () => {
    if (!organization) {
      setTeams([]);
      return;
    }
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organization.id);
        
      if (error) throw error;
      
      setTeams(data);
      
      // If a current team is set, refresh its data
      if (currentTeam) {
        const updatedTeam = data.find(team => team.id === currentTeam.id);
        if (updatedTeam) {
          setCurrentTeam(updatedTeam);
          await fetchTeamMembers(updatedTeam.id);
        } else {
          setCurrentTeam(null);
          setTeamMembers(null);
        }
      }
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      setIsError(true);
      toast({
        variant: "destructive",
        title: "Failed to load teams",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch team members for a specific team
  const fetchTeamMembers = async (teamId: string) => {
    if (!teamId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);
        
      if (error) throw error;
      
      setTeamMembers(data as TeamMember[]);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast({
        variant: "destructive",
        title: "Failed to load team members",
        description: error.message,
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
      await fetchTeamMembers(teamId);
    }
  };

  // Create a new team
  const createTeam = async (name: string, description?: string): Promise<Team | null> => {
    if (!organization) return null;
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name,
          description,
          organization_id: organization.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Refresh teams list
      await fetchTeams();
      
      toast({
        title: "Team created",
        description: `Team "${name}" has been created successfully.`,
      });
      
      return data;
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
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);
        
      if (error) throw error;
      
      // Refresh teams list
      await fetchTeams();
      
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
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
        
      if (error) throw error;
      
      // If current team is deleted, reset current team
      if (currentTeam?.id === teamId) {
        setCurrentTeam(null);
        setTeamMembers(null);
      }
      
      // Refresh teams list
      await fetchTeams();
      
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

  // Helper function to find a user by email
  const findUserByEmail = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select("id")
        .eq("email", email)
        .maybeSingle();
        
      if (error) throw new Error("Error finding user: " + error.message);
      if (!data) throw new Error("User not found with this email");
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Add a member to the team
  const addTeamMember = async (teamId: string, email: string, role: TeamMember['role']) => {
    try {
      // Find user by email
      const user = await findUserByEmail(email);
      
      // Add user to team
      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: user.id,
          role
        }]);
        
      if (error) throw error;
      
      // Refresh team members
      await fetchTeamMembers(teamId);
      
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
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Refresh team members if current team is set
      if (currentTeam) {
        await fetchTeamMembers(currentTeam.id);
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
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Refresh team members if current team is set
      if (currentTeam) {
        await fetchTeamMembers(currentTeam.id);
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

  // Load teams when organization changes
  useEffect(() => {
    if (organization) {
      fetchTeams();
    } else {
      setTeams(null);
      setCurrentTeam(null);
      setTeamMembers(null);
      setIsLoading(false);
    }
  }, [organization]);

  const refreshTeams = fetchTeams;

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

export function useTeams() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeams must be used within a TeamProvider");
  }
  return context;
}
