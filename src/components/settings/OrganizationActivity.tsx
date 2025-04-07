
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

type OrganizationLogType = {
  id: string;
  user_id: string;
  module: string;
  action: string;
  timestamp: string;
  metadata: any;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
};

export function OrganizationActivity() {
  const { organization } = useOrganization();
  const [logs, setLogs] = useState<OrganizationLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrgLogs = async () => {
      if (!organization?.id) return;

      try {
        setIsLoading(true);
        
        // Call the get_organization_logs function
        const { data, error } = await supabase.rpc('get_organization_logs', { 
          org_id_param: organization.id 
        });

        if (error) throw error;
        
        if (Array.isArray(data)) {
          // Convert the returned data to the expected format
          const formattedLogs: OrganizationLogType[] = data.map((log: any) => ({
            id: log.id,
            user_id: log.user_id,
            module: log.module,
            action: log.action,
            timestamp: log.timestamp,
            metadata: log.metadata,
            profiles: log.profiles
          }));
          
          setLogs(formattedLogs);
        } else {
          console.error("Unexpected data format returned:", data);
          setLogs([]);
        }
      } catch (error) {
        console.error("Error fetching organization logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgLogs();
  }, [organization]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading organization activity...</div>;
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No activity recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {logs.map((log) => {
            // Format action for display
            const actionDisplay = log.action.charAt(0).toUpperCase() + log.action.slice(1);
            
            return (
              <div key={log.id} className="flex flex-col space-y-1 border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{log.module}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "PPp")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm">
                    <span className="font-medium">{actionDisplay}</span>{" "}
                    {log.metadata && formatMetadata(log.metadata)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.profiles?.full_name || log.profiles?.email || "Unknown user"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatMetadata(metadata: any): string {
  if (!metadata) return "";
  
  // Handle different types of metadata based on the available fields
  if (metadata.email) {
    return `- ${metadata.email}`;
  }
  
  if (metadata.newRole) {
    return `- Updated to ${metadata.newRole}`;
  }
  
  if (metadata.name) {
    return `- ${metadata.name}`;
  }
  
  // Default case - show a reasonable summary
  const keys = Object.keys(metadata).filter(key => key !== 'id' && key !== 'user_id');
  if (keys.length > 0) {
    return `- ${keys.map(key => metadata[key]).join(", ")}`;
  }
  
  return "";
}
