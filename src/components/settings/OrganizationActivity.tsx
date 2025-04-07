
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
  const [filter, setFilter] = useState<string | null>(null);

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

  // Get unique modules for filtering
  const modules = Array.from(new Set(logs.map(log => log.module)));

  // Filter logs by module if a filter is selected
  const filteredLogs = filter 
    ? logs.filter(log => log.module === filter)
    : logs;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading organization activity...</p>
        </CardContent>
      </Card>
    );
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
        <CardDescription>
          Recent actions performed in your organization
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-4">
          {filter && (
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilter(null)}
            >
              All
            </Badge>
          )}
          {modules.map(module => (
            <Badge 
              key={module} 
              variant={filter === module ? "default" : "outline"}
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilter(filter === module ? null : module)}
            >
              {module}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredLogs.map((log) => {
            // Format action for display
            const actionDisplay = log.action.charAt(0).toUpperCase() + log.action.slice(1);
            
            // Format module for display
            const moduleDisplay = log.module.charAt(0).toUpperCase() + log.module.slice(1);
            
            return (
              <div key={log.id} className="flex flex-col space-y-1 border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.module === 'accounting' ? 'default' : 'secondary'}>
                      {moduleDisplay}
                    </Badge>
                    <span className="text-sm font-medium">{actionDisplay}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "PPp")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm">
                    {log.metadata && formatMetadata(log.metadata, log.module)}
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

function formatMetadata(metadata: any, module: string): string {
  if (!metadata) return "";
  
  // Special formatting for accounting module
  if (module === 'accounting') {
    if (metadata.invoice_number) {
      return `Invoice #${metadata.invoice_number}${metadata.status ? ` - ${metadata.status}` : ''}${metadata.amount ? ` ($${metadata.amount})` : ''}`;
    }
    
    if (metadata.bill_number) {
      return `Bill #${metadata.bill_number}${metadata.status ? ` - ${metadata.status}` : ''}${metadata.amount ? ` ($${metadata.amount})` : ''}`;
    }
    
    if (metadata.code && metadata.name) {
      return `Account ${metadata.code} - ${metadata.name}`;
    }
    
    if (metadata.type && metadata.amount) {
      return `Payment - ${metadata.type} ($${metadata.amount})`;
    }
  }
  
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
