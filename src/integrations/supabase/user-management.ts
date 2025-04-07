
import { supabase } from "@/integrations/supabase/client";

/**
 * Invite a user to the organization
 */
export const inviteUser = async (email: string, role: "admin" | "member"): Promise<void> => {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No active session");
    }
    
    // Get organization from user roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select("organization_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
      
    if (!userRole?.organization_id) {
      throw new Error("No organization found for the current user");
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select("id")
      .eq("email", email)
      .maybeSingle();
      
    if (existingUser) {
      // User exists, check if already in the organization
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select("*")
        .eq('user_id', existingUser.id)
        .eq('organization_id', userRole.organization_id)
        .maybeSingle();
        
      if (existingRole) {
        throw new Error("User is already a member of this organization");
      }
      
      // Add existing user to organization
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: existingUser.id,
          organization_id: userRole.organization_id,
          role
        }]);
        
      if (roleError) throw roleError;
    } else {
      // Create a new invitation
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry
      
      // Generate token
      const { data: token, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
        
      if (tokenError) throw tokenError;
      
      // Insert invitation
      const { error: inviteError } = await supabase
        .from("invitations")
        .insert([
          {
            organization_id: userRole.organization_id,
            email,
            role,
            invited_by: session.user.id,
            token,
            expires_at: expiresAt.toISOString(),
          },
        ]);
        
      if (inviteError) throw inviteError;
    }
  } catch (error: any) {
    console.error("Error inviting user:", error);
    throw error;
  }
};

/**
 * Update a user's role in the organization
 */
export const updateUserRole = async (userId: string, newRole: "admin" | "member"): Promise<void> => {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No active session");
    }
    
    // Get organization from user roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select("organization_id, role")
      .eq("user_id", session.user.id)
      .maybeSingle();
      
    if (!userRole?.organization_id) {
      throw new Error("No organization found for the current user");
    }
    
    // Check if current user is admin
    if (userRole.role !== 'admin') {
      throw new Error("Only admins can update user roles");
    }
    
    // Update the user's role
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq("user_id", userId)
      .eq("organization_id", userRole.organization_id);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

/**
 * Remove a user from the organization
 */
export const removeUser = async (userId: string): Promise<void> => {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No active session");
    }
    
    // Get organization from user roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select("organization_id, role")
      .eq("user_id", session.user.id)
      .maybeSingle();
      
    if (!userRole?.organization_id) {
      throw new Error("No organization found for the current user");
    }
    
    // Check if current user is admin
    if (userRole.role !== 'admin') {
      throw new Error("Only admins can remove users");
    }
    
    // Don't allow removing yourself
    if (userId === session.user.id) {
      throw new Error("You cannot remove yourself from the organization");
    }
    
    // Remove the user from the organization
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", userRole.organization_id);
      
    if (error) throw error;
  } catch (error: any) {
    console.error("Error removing user:", error);
    throw error;
  }
};
