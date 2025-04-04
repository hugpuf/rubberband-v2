import { ReactNode } from "react";

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

export type TeamContextType = {
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

export interface TeamProviderProps {
  children: ReactNode;
}
