
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type Organization = {
  id: string;
  name: string;
  created_at: string;
};

export type UserRole = {
  user_id: string;
  organization_id: string;
  role: "admin" | "manager" | "viewer";
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

type OrganizationUser = {
  role: string;
  user_id: string;
  profiles: Profile;
};

type OrganizationContextType = {
  organization: Organization | null;
  userRole: string | null;
  organizationUsers: OrganizationUser[] | null;
  isAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
  refreshOrganization: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  inviteUser: (email: string, role: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  
  // Check if user has admin role
  const isAdmin = userRole === "admin";

  const fetchOrganization = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      console.log("Fetching organization data for user:", user.id);
      
      // First get the user's role and organization ID - don't use single() to avoid 406 errors
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select("organization_id, role")
        .eq("user_id", user.id);
      
      if (roleError) {
        console.error("Error fetching user roles:", roleError);
        throw roleError;
      }
      
      if (!roleData || roleData.length === 0) {
        console.log("No organization role found for user");
        setIsLoading(false);
        return;
      }
      
      console.log("Found user role:", roleData[0]);
      setUserRole(roleData[0].role);
      
      // Then fetch the organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select("*")
        .eq("id", roleData[0].organization_id)
        .maybeSingle(); // Use maybeSingle() instead of single()
        
      if (orgError) {
        console.error("Error fetching organization:", orgError);
        throw orgError;
      }
      
      if (orgData) {
        console.log("Found organization:", orgData.name);
        setOrganization(orgData);
      } else {
        console.log("No organization found with ID:", roleData[0].organization_id);
      }
      
      // Fetch all users in the organization with their roles and profiles
      // Use the explicitly defined relationship between user_roles and profiles
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select(`
          role,
          user_id,
          profiles(*)
        `)
        .eq("organization_id", roleData[0].organization_id);
        
      if (usersError) {
        console.error("Error fetching organization users:", usersError);
        throw usersError;
      }
      
      console.log("Fetched organization users:", usersData);
      setOrganizationUsers(usersData as unknown as OrganizationUser[]);
    } catch (error) {
      console.error("Error fetching organization:", error);
      setIsError(true);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load organization data",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchOrganization();
    } else {
      setOrganization(null);
      setUserRole(null);
      setOrganizationUsers(null);
    }
  }, [user]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq("id", organization.id);
        
      if (error) throw error;
      
      await refreshOrganization();
      toast({
        title: "Organization updated",
        description: "Organization details have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update organization",
      });
    }
  };

  // Helper function to find user by email
  const findUserByEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select("id")
      .eq("email", email)
      .maybeSingle();
      
    if (error) throw new Error("Error finding user: " + error.message);
    if (!data) throw new Error("User not found with this email");
    return data;
  };

  // Simplified invite user function (a real implementation would send emails)
  const inviteUser = async (email: string, role: string) => {
    if (!organization || !isAdmin) return;
    
    try {
      // Find user by email
      const userData = await findUserByEmail(email);
      if (!userData) throw new Error("User not found with this email");
      
      console.log("Found user to invite:", userData.id);
      
      // Add user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userData.id,
          organization_id: organization.id,
          role,
        }]);
        
      if (roleError) {
        console.error("Error adding user role:", roleError);
        throw roleError;
      }
      
      await refreshOrganization();
      toast({
        title: "User invited",
        description: `${email} has been added to your organization.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: error.message || "Failed to invite user",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!organization || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("organization_id", organization.id);
        
      if (error) throw error;
      
      await refreshOrganization();
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update user role",
      });
    }
  };

  const removeUser = async (userId: string) => {
    if (!organization || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", organization.id);
        
      if (error) throw error;
      
      await refreshOrganization();
      toast({
        title: "User removed",
        description: "User has been removed from your organization.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: error.message || "Failed to remove user",
      });
    }
  };

  const contextValue = {
    organization,
    userRole,
    organizationUsers,
    isAdmin,
    isLoading,
    isError,
    refreshOrganization,
    updateOrganization,
    inviteUser,
    updateUserRole,
    removeUser,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
