
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgProfile } from "@/components/settings/OrgProfile";
import { UserManagement } from "@/components/settings/UserManagement";
import { DangerZone } from "@/components/settings/DangerZone";
import { useOrganization } from "@/hooks/useOrganization";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

const Settings = () => {
  const { isAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState("profile");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-[#1C1C1E]">Settings</h1>
        <p className="text-[#636366] mt-2 tracking-wide">
          Manage your organization and user settings
        </p>
      </div>
      
      <div className="flex gap-4 items-center">
        <Link to="/settings/teams">
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-[#F5F5F7] p-1 rounded-lg">
          <TabsTrigger 
            value="profile" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Organization Profile
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            User Management
          </TabsTrigger>
          <TabsTrigger 
            value="account"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            My Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <OrgProfile />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="account" className="space-y-6">
          <div>
            <h2 className="text-xl font-normal text-[#1C1C1E] tracking-tight">Account Settings</h2>
            <p className="text-[#636366] tracking-wide">
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
