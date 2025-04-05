
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  BarChart3,
  Lightbulb,
  BarChart2,
  Users,
  UserPlus
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
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; full_name?: string } | null>(null);

  // Fetch user profile to get full name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleSignOut = () => {
    console.log("Sign out button clicked");
    signOut();
  };

  const topLevelItems = [
    {
      title: "pilot's chair",
      icon: BarChart3,
      url: "/dashboard",
    },
  ];

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

  const sidebarLinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart2,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      name: 'User Management',
      href: '/settings/users',
      icon: Users,
    },
    {
      name: 'Team Management',
      href: '/settings/teams',
      icon: UserPlus,
    },
  ];

  const isActive = (url: string) => {
    return location.pathname.startsWith(url);
  };

  // Get user display name from profile
  const getDisplayName = () => {
    // If we have a full name, use that
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    
    // If we have first and last name, combine them
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    
    // If we have just first name
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    
    // Fallback to email username
    return user?.email?.split("@")[0] || "User";
  };

  const userInitials = userProfile?.first_name && userProfile?.last_name 
    ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
    : user?.email 
      ? user.email.substring(0, 2).toUpperCase() 
      : "RB";

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

      <SidebarContent className="px-5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topLevelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start rounded-lg text-[#1C1C1E] px-3 py-2 hover:bg-[#EAEAEC] hover:text-[#1C1C1E] font-normal transition-all ${
                        isActive(item.url) 
                          ? 'bg-white shadow-[0_2px_5px_rgba(0,0,0,0.08)] hover:bg-white' 
                          : ''
                      }`}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4 stroke-[1.5px]" />
                      <span className="font-normal text-sm">{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs uppercase font-normal tracking-wider text-[#8E9196] px-2 mb-2">
            management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="h-1"></div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
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
                      className={`w-full justify-start rounded-lg px-3 py-2 text-[#636366] hover:bg-[#EAEAEC] hover:text-[#1C1C1E] font-normal ${
                        isActive(item.url) 
                          ? 'bg-white text-[#1C1C1E] shadow-[0_2px_5px_rgba(0,0,0,0.08)] hover:bg-white' 
                          : ''
                      }`}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4 stroke-[1.5px]" />
                      <span className="font-normal text-sm">{item.title}</span>
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
            <div className="text-sm font-normal text-[#1C1C1E]">
              {getDisplayName()}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="text-[#636366] hover:text-[#1C1C1E]"
          >
            <LogOut className="h-4 w-4 stroke-[1.5px]" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
