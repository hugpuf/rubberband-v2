
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgProfile } from "@/components/settings/OrgProfile";
import { UserManagement } from "@/components/settings/UserManagement";
import { DangerZone } from "@/components/settings/DangerZone";
import { useOrganization } from "@/hooks/useOrganization";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const { isAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState("profile");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and user settings
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Organization Profile</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="account">My Account</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <OrgProfile />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="account" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Account Settings</h2>
            <p className="text-muted-foreground">
              Manage your personal account settings and preferences
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
