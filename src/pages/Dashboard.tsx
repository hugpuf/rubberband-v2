
import { BusinessPerformanceWidget } from "@/components/dashboard/BusinessPerformanceWidget";
import { NotificationsWidget } from "@/components/dashboard/NotificationsWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { AICopilot } from "@/components/dashboard/AICopilot";
import { useOrganization } from "@/hooks/useOrganization";

const Dashboard = () => {
  const { organization } = useOrganization();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-gray-800">Pilot's Chair</h1>
        <p className="text-gray-500 mt-1">
          Welcome to your command center, {organization?.name}
        </p>
      </div>
      
      <div className="rounded-2xl bg-gray-50 p-6 shadow-sm">
        <AICopilot />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <BusinessPerformanceWidget />
        </div>
        <div className="space-y-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <NotificationsWidget />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <InsightsWidget />
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-xl font-medium mb-6 text-gray-800">Module Widgets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for future module widgets */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-white">
              <p className="text-gray-500">Module Widget {i}</p>
              <p className="text-xs text-gray-400 mt-2">
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
