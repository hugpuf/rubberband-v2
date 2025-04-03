
import { useNavigate } from "react-router-dom";
import { Settings, LayoutDashboard, LogOut, Users, Home } from "lucide-react";

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

  const mainMenuItems = [
    {
      title: "Pilot's Chair",
      icon: LayoutDashboard,
      url: "/dashboard",
    },
    {
      title: "Home",
      icon: Home,
      url: "/",
    },
  ];

  const adminMenuItems = [
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
    },
    {
      title: "User Management",
      icon: Users,
      url: "/settings/users",
    },
  ];

  // Placeholder for user initials
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "RB";

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="py-4">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-white">
            <AvatarImage src="" alt="Organization Logo" />
            <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
              {organization?.name?.substring(0, 2).toUpperCase() || "RB"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {organization?.name || "Rubberband OS"}
            </span>
            <span className="text-xs text-gray-500">
              {user?.email || ""}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-gray-200 text-gray-700">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium text-gray-700">
              {user?.email?.split("@")[0] || "User"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-500 hover:text-gray-900">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
