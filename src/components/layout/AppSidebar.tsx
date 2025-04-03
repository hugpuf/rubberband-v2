
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  BarChart,
  Lightbulb
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

export function AppSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Updated navigation structure - Only Pilot's Chair at the top level
  const topLevelItems = [
    {
      title: "pilot's chair",
      icon: BarChart,
      url: "/dashboard",
    },
  ];

  // New Management section (will be populated with ERP modules in future)
  // Currently empty as specified in the requirements

  // Updated Settings section (removed User Management)
  const settingsItems = [
    {
      title: "settings",
      icon: Settings,
      url: "/settings",
    },
    {
      title: "ideas",
      icon: Lightbulb,
      url: "/ideas",
    },
  ];

  // Placeholder for user initials
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "RB";

  return (
    <Sidebar className="backdrop-blur-lg bg-[rgba(250,250,252,0.8)] border-r border-gray-100">
      <SidebarHeader className="py-6 px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Organization Logo" />
            <AvatarFallback className="bg-gray-50 text-gray-600 font-medium">
              {organization?.name?.substring(0, 2).toUpperCase() || "RB"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-[#1C1C1E] tracking-wide">
              {organization?.name || "Rubberband OS"}
            </span>
            <span className="text-xs text-[#636366] tracking-wide">
              {user?.email || ""}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-6">
        {/* Top level item - Pilot's Chair */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topLevelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-full text-[#1C1C1E] bg-white hover:bg-white hover:text-[#1C1C1E] font-medium tracking-wide shadow-sm transition-all"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4 stroke-[1.5px]" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Management section - For future ERP modules */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs uppercase font-normal tracking-wider text-[#8E9196] px-2 mb-2">
            management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Future modules will be added here */}
              <div className="h-1"></div> {/* Space holder for future items */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Settings section - renamed from Administration */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs uppercase font-normal tracking-wider text-[#8E9196] px-2 mb-2">
            settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-full text-[#636366] hover:bg-[#EAEAEC] hover:text-[#1C1C1E] font-normal tracking-wider"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4 stroke-[1.5px]" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-gray-50 text-gray-600">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-normal tracking-wide text-[#1C1C1E]">
              {user?.email?.split("@")[0] || "User"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-[#636366] hover:text-[#1C1C1E]">
            <LogOut className="h-4 w-4 stroke-[1.5px]" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
