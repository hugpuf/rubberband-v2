import { supabase } from "@/integrations/supabase/client";
import { Team, TeamMember } from "./types";

// Fetch teams for an organization
export const fetchTeams = async (organizationId: string) => {
  if (!organizationId) {
    console.log("No organization ID provided, cannot fetch teams");
    return [];
  }
  
  try {
    console.log("Fetching teams for organization:", organizationId);
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId);
      
    if (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
    
    console.log("Teams fetched:", data);
    return data || [];
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    // Return empty array instead of throwing to allow UI to handle no data state
    return [];
  }
};

// Fetch team members for a specific team
export const fetchTeamMembers = async (teamId: string) => {
  if (!teamId) return [];
  
  try {
    console.log("Fetching team members for team:", teamId);
    
    // First get the team_members
    const { data: teamMembersData, error: teamMembersError } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role')
      .eq('team_id', teamId);
      
    if (teamMembersError) {
      console.error("Error fetching team members:", teamMembersError);
      throw teamMembersError;
    }
    
    // If no team members, return empty array
    if (!teamMembersData || teamMembersData.length === 0) {
      return [];
    }
    
    // For each team member, fetch their profile separately
    const teamMembers: TeamMember[] = await Promise.all(
      teamMembersData.map(async (member) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name, avatar_url')
          .eq('id', member.user_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile for user:", member.user_id, profileError);
          // Provide default/placeholder profile data
          return {
            ...member,
            profiles: {
              email: "unknown@example.com",
              full_name: null,
              avatar_url: null
            }
          } as TeamMember;
        }
        
        return {
          ...member,
          profiles: profileData
        } as TeamMember;
      })
    );
    
    console.log("Team members with profiles fetched:", teamMembers);
    return teamMembers;
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    // Return empty array instead of throwing
    return [];
  }
};

// Create a new team
export const createNewTeam = async (name: string, description: string | undefined, organizationId: string) => {
  if (!organizationId) return null;
  
  try {
    console.log("Creating team:", name, "for organization:", organizationId);
    
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name,
        description,
        organization_id: organizationId
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    console.log("Team created:", data);
    
    return data as Team;
  } catch (error: any) {
    console.error("Error creating team:", error);
    throw error;
  }
};

// Update team details
export const updateTeamDetails = async (teamId: string, updates: Partial<Team>) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error updating team:", error);
    throw error;
  }
};

// Delete a team
export const deleteTeamById = async (teamId: string) => {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error deleting team:", error);
    throw error;
  }
};

// Helper function to find a user by email
export const findUserByEmail = async (email: string) => {
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

// Add a member to a team
export const addMemberToTeam = async (teamId: string, email: string, role: TeamMember['role']) => {
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
  } catch (error: any) {
    console.error("Error adding team member:", error);
    throw error;
  }
};

// Update a team member's role
export const updateMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error updating team member role:", error);
    throw error;
  }
};

// Remove a member from a team
export const removeMemberFromTeam = async (memberId: string) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error removing team member:", error);
    throw error;
  }
};
