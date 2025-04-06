
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserLogAction = 
  | "login" 
  | "logout" 
  | "create" 
  | "update" 
  | "delete" 
  | "view" 
  | "navigate" 
  | "export" 
  | "import" 
  | "download"
  | "upload"
  | "share"
  | "invite";

export type UserLogMetadata = {
  [key: string]: any;
};

export type UserLogPayload = {
  module: string;
  action: UserLogAction | string;
  recordId?: string;
  metadata?: UserLogMetadata;
  teamId?: string;
};

/**
 * Log a user action without blocking the UI
 */
export const logUserAction = async ({
  module,
  action,
  recordId,
  metadata = {},
  teamId,
}: UserLogPayload): Promise<void> => {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("Cannot log user action: No active user session");
      return;
    }

    // Get organization from user roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select("organization_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!roleData?.organization_id) {
      console.warn("Cannot log user action: No organization found for user");
      return;
    }

    // Enhanced metadata with MCP context
    const enhancedMetadata = {
      ...metadata,
      userAgent: navigator.userAgent,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    // Log the action
    await supabase.from('user_logs').insert({
      user_id: session.user.id,
      organization_id: roleData.organization_id,
      team_id: teamId || null,
      module,
      action,
      record_id: recordId,
      metadata: enhancedMetadata,
    });

    console.debug(`[LOG] ${module}:${action}`, { recordId, metadata });
  } catch (error) {
    // Never block the UI flow due to logging errors
    console.error("Failed to log user action:", error);
  }
};

/**
 * Hook for logging user actions
 */
export const useUserLogger = () => {
  const { toast } = useToast();

  const logAction = async (payload: UserLogPayload) => {
    try {
      await logUserAction(payload);
    } catch (error) {
      console.error("Error logging user action:", error);
      // Optionally notify on critical logging failures
      // toast({
      //   variant: "destructive",
      //   title: "Logging Error",
      //   description: "Failed to record your activity",
      // });
    }
  };

  return { logAction };
};
