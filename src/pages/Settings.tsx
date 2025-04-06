
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgProfile } from "@/components/settings/OrgProfile";
import { UserManagement } from "@/components/settings/UserManagement";
import { DangerZone } from "@/components/settings/DangerZone";
import { UserProfile } from "@/components/settings/UserProfile";
import { UserActivity } from "@/components/settings/UserActivity";
import { OrganizationActivity } from "@/components/settings/OrganizationActivity";
import { useOrganization } from "@/hooks/useOrganization";
import { Separator } from "@/components/ui/separator";
import { logUserAction } from "@/services/userLogs";

const Settings = () => {
  const { isAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Log page view and tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    logUserAction({
      module: "Settings",
      action: "navigate",
      metadata: { tab: value }
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-[#1C1C1E]">Settings</h1>
        <p className="text-[#636366] mt-2 tracking-wide">
          Manage your organization and user settings
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 bg-[#F5F5F7] p-1 rounded-lg">
          <TabsTrigger 
            value="profile" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Organization Profile
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger 
              value="users"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
            >
              User Management
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="account"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            My Account
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            My Activity
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger 
              value="org-activity"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
            >
              Organization Activity
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="profile">
          <OrgProfile />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
        <TabsContent value="account" className="space-y-6">
          <div>
            <h2 className="text-xl font-normal text-[#1C1C1E] tracking-tight">Account Settings</h2>
            <p className="text-[#636366] tracking-wide">
              Manage your personal account settings and preferences
            </p>
          </div>
          
          <UserProfile />
          
          <Separator className="my-6" />
          
          <DangerZone />
        </TabsContent>
        <TabsContent value="activity">
          <div className="mb-6">
            <h2 className="text-xl font-normal text-[#1C1C1E] tracking-tight">My Activity</h2>
            <p className="text-[#636366] tracking-wide">
              View your recent activity across the platform
            </p>
          </div>
          <UserActivity />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="org-activity">
            <div className="mb-6">
              <h2 className="text-xl font-normal text-[#1C1C1E] tracking-tight">Organization Activity</h2>
              <p className="text-[#636366] tracking-wide">
                Monitor user activities across your organization
              </p>
            </div>
            <OrganizationActivity />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
