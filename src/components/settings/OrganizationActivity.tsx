import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, Download, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logUserAction } from "@/services/userLogs";

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
  };
};

export const OrganizationActivity = () => {
  const { user } = useAuth();
  const { organization, isAdmin } = useOrganization();
  const { toast } = useToast();
  const [logs, setLogs] = useState<OrganizationLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7days");
  const [uniqueModules, setUniqueModules] = useState<string[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, name: string}[]>([]);
  
  // Log the view of this component
  useEffect(() => {
    if (user && isAdmin) {
      logUserAction({
        module: "Settings",
        action: "view",
        metadata: { section: "Organization Activity" }
      });
    }
  }, [user, isAdmin]);

  // Get date range from filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return subDays(now, 1);
      case "7days":
        return subDays(now, 7);
      case "30days":
        return subDays(now, 30);
      case "90days":
        return subDays(now, 90);
      default:
        return subDays(now, 7);
    }
  };

  // Fetch logs for the organization
  useEffect(() => {
    const fetchLogs = async () => {
      if (!organization || !isAdmin) return;
      
      setIsLoading(true);
      try {
        const fromDate = getDateRange();
        
        // Using RPC to work around the TypeScript issue
        const { data, error } = await supabase
          .rpc('get_organization_logs', {
            org_id_param: organization.id,
            from_date: fromDate.toISOString()
          });
          
        if (error) throw error;
        
        // Type assertion to work around the TypeScript issue
        setLogs(data as OrganizationLogType[] || []);
        
        // Extract unique modules, actions, and users for filters
        if (data) {
          const typedData = data as OrganizationLogType[];
          const modules = [...new Set(typedData.map(log => log.module))];
          const actions = [...new Set(typedData.map(log => log.action))];
          
          // Create a unique list of users
          const users = typedData.reduce((acc, log) => {
            const userId = log.user_id;
            const profile = log.profiles;
            
            if (!acc.some(u => u.id === userId)) {
              acc.push({
                id: userId,
                name: profile?.full_name || profile?.email || userId
              });
            }
            
            return acc;
          }, [] as {id: string, name: string}[]);
          
          setUniqueModules(modules);
          setUniqueActions(actions);
          setUniqueUsers(users);
        }
      } catch (error) {
        console.error("Error fetching organization logs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load organization activity logs"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [organization, isAdmin, dateFilter, toast]);
  
  // Apply filters
  const filteredLogs = logs.filter(log => {
    const moduleMatch = moduleFilter === "all" || log.module === moduleFilter;
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
    const userMatch = userFilter === "all" || log.user_id === userFilter;
    return moduleMatch && actionMatch && userMatch;
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
  
  // Export logs to CSV
  const exportToCSV = () => {
    if (!filteredLogs.length) return;
    
    // Log this action
    logUserAction({
      module: "Settings",
      action: "export",
      metadata: { type: "csv", section: "Organization Activity" }
    });
    
    // Create CSV header
    const headers = ["User", "Module", "Action", "Timestamp", "Details"];
    
    // Create CSV rows
    const rows = filteredLogs.map(log => [
      log.profiles?.full_name || log.profiles?.email || log.user_id,
      log.module,
      log.action,
      formatTimestamp(log.timestamp),
      JSON.stringify(log.metadata)
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    // Create a blob and generate download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `organization-activity-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success toast
    toast({
      title: "Export Successful",
      description: "Activity logs have been exported to CSV"
    });
  };
  
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            You need admin privileges to view organization activity.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Organization Activity</CardTitle>
          <CardDescription>
            View activity across your organization
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
            
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-1 block">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Last 7 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.profiles?.full_name || log.profiles?.email || log.user_id}
                      </TableCell>
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
