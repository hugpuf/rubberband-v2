
import { BusinessPerformanceWidget } from "@/components/dashboard/BusinessPerformanceWidget";
import { NotificationsWidget } from "@/components/dashboard/NotificationsWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { AICopilot } from "@/components/dashboard/AICopilot";
import { useOrganization } from "@/hooks/useOrganization";

const Dashboard = () => {
  const { organization } = useOrganization();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pilot's Chair</h1>
        <p className="text-muted-foreground">
          Welcome to your command center, {organization?.name}
        </p>
      </div>
      
      <AICopilot />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BusinessPerformanceWidget />
        <div className="space-y-6">
          <NotificationsWidget />
          <InsightsWidget />
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Module Widgets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder for future module widgets */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-muted-foreground">Module Widget {i}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Future module content will appear here
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
