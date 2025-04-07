
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserLogType = {
  id: string;
  module: string;
  action: string;
  timestamp: string;
  metadata: any;
};

export function UserActivity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<UserLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserLogs = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs(data as UserLogType[]);
      } catch (error) {
        console.error("Error fetching user logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLogs();
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading activity logs...</div>;
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
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
        <CardTitle>Recent Activity</CardTitle>
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
                <p className="text-sm">
                  <span className="font-medium">{actionDisplay}</span>{" "}
                  {log.metadata && formatMetadata(log.metadata)}
                </p>
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
