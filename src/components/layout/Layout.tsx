
import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { logUserAction } from "@/services/userLogs";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Log navigation events
  useEffect(() => {
    if (user) {
      const path = location.pathname;
      const module = getModuleFromPath(path);
      
      logUserAction({
        module,
        action: "navigate",
        metadata: { path, previousPath: document.referrer }
      });
    }
  }, [location.pathname, user]);
  
  // Helper to determine module from path
  const getModuleFromPath = (path: string): string => {
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/user-management")) return "User Management";
    if (path.startsWith("/onboarding")) return "Onboarding";
    return "Application";
  };

  // If no user, don't show the layout
  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F7F7F7]">
        <AppSidebar />
        <main className={cn("flex-1 overflow-auto transition-all duration-300 bg-[#F7F7F7]")}>
          <div className="container mx-auto p-4 md:p-8 pt-20">
            {isMobile && (
              <div className="fixed top-4 left-4 z-10">
                <SidebarTrigger />
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 border border-gray-50">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
