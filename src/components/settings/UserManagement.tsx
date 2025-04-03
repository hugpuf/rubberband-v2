
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { UsersList } from "@/components/settings/UsersList";
import { UserInvitations } from "@/components/settings/UserInvitations";
import { TeamManagementSection } from "@/components/settings/TeamManagementSection";
import { Users, Mail, UserPlus, Users2 } from "lucide-react";
import { TeamProvider } from "@/hooks/teams";

export function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-rubberband-light p-2">
          <Users className="h-5 w-5 text-rubberband-primary" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-[#1C1C1E]">User Management</h2>
          <p className="text-[#636366]">
            Manage users, invitations, and teams in your organization
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-[#F5F5F7] p-1 rounded-lg">
          <TabsTrigger 
            value="users" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="invitations"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger 
            value="teams"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal flex items-center gap-2"
          >
            <Users2 className="h-4 w-4" />
            Teams
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="invitations">
          <TeamProvider>
            <UserInvitations />
          </TeamProvider>
        </TabsContent>
        
        <TabsContent value="teams">
          <TeamProvider>
            <TeamManagementSection />
          </TeamProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
}
