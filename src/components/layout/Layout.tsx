
import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

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
