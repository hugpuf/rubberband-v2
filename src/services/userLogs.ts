
import { supabase } from '@/integrations/supabase/client';

export interface UserLogParams {
  module: string;
  action: string;
  recordId?: string;
  metadata?: Record<string, any>;
  teamId?: string;
}

/**
 * Logs a user action to the database
 */
export const logUserAction = async (params: UserLogParams): Promise<boolean> => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('No authenticated user found when trying to log action');
      return false;
    }

    // Get user's organization
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    const organizationId = userRole?.organization_id;
    
    // Create log entry
    const { error } = await supabase
      .from('user_logs')
      .insert({
        user_id: session.user.id,
        module: params.module,
        action: params.action,
        record_id: params.recordId,
        metadata: params.metadata || {},
        organization_id: organizationId,
        team_id: params.teamId,
      });

    if (error) {
      console.error('Error logging user action:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logUserAction:', error);
    return false;
  }
};

/**
 * Get audit logs for the current user
 */
export const getUserLogs = async (limit = 50): Promise<any[]> => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('No authenticated user found when trying to get user logs');
      return [];
    }

    // Get user logs
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserLogs:', error);
    return [];
  }
};

/**
 * Get audit logs for the current user's organization
 * Only for admins and managers
 */
export const getOrganizationLogs = async (limit = 100): Promise<any[]> => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('No authenticated user found when trying to get organization logs');
      return [];
    }

    // Get user's organization and role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id, role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    if (!userRole?.organization_id) {
      console.warn('No organization found for user');
      return [];
    }
    
    // Check if user is an admin or manager
    if (userRole.role !== 'admin' && userRole.role !== 'manager') {
      console.warn('User does not have permission to view organization logs');
      return [];
    }
    
    // Get organization logs with user profiles
    const { data, error } = await supabase
      .from('user_logs')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq('organization_id', userRole.organization_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching organization logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOrganizationLogs:', error);
    return [];
  }
};
