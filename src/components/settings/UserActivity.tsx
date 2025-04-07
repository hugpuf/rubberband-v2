
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { logUserAction } from "@/services/userLogs";

type UserLogType = {
  id: string;
  module: string;
  action: string;
  timestamp: string;
  metadata: any;
};

export const UserActivity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<UserLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [uniqueModules, setUniqueModules] = useState<string[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  
  // Log the view of this component
  useEffect(() => {
    if (user) {
      logUserAction({
        module: "Settings",
        action: "view",
        metadata: { section: "My Activity" }
      });
    }
  }, [user]);

  // Fetch logs for the current user
  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Here we directly craft the SQL query since TypeScript doesn't recognize user_logs table yet
        const { data, error } = await supabase
          .rpc('get_user_logs', { user_id_param: user.id });
          
        if (error) throw error;
        
        // Type assertion to work around the TypeScript issue
        setLogs(data as UserLogType[] || []);
        
        // Extract unique modules and actions for filters
        if (data) {
          const typedData = data as UserLogType[];
          const modules = [...new Set(typedData.map(log => log.module))];
          const actions = [...new Set(typedData.map(log => log.action))];
          setUniqueModules(modules);
          setUniqueActions(actions);
        }
      } catch (error) {
        console.error("Error fetching user logs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load activity logs"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [user, toast]);
  
  // Apply filters
  const filteredLogs = logs.filter(log => {
    const moduleMatch = moduleFilter === "all" || log.module === moduleFilter;
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
    return moduleMatch && actionMatch;
  });
  
  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return timestamp;
    }
  };
  
  // Get badge color based on action
  const getActionBadgeColor = (action: string) => {
    const actionMap: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      view: "bg-gray-100 text-gray-800",
      login: "bg-purple-100 text-purple-800",
      logout: "bg-yellow-100 text-yellow-800",
      navigate: "bg-indigo-100 text-indigo-800",
      export: "bg-teal-100 text-teal-800",
      import: "bg-pink-100 text-pink-800",
      upload: "bg-amber-100 text-amber-800",
      download: "bg-cyan-100 text-cyan-800",
    };
    
    return actionMap[action] || "bg-gray-100 text-gray-800";
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Activity</CardTitle>
        <CardDescription>
          View your recent activity across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-1 block">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueModules.map(module => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{log.module}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle>Activity Details</DrawerTitle>
                              <DrawerDescription>
                                {log.module} - {log.action} - {formatTimestamp(log.timestamp)}
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4">
                              <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                            <DrawerFooter>
                              <DrawerClose asChild>
                                <Button variant="outline">Close</Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-50 rounded-md">
              <p className="text-gray-500">No activity logs found with the selected filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
