
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
        <h1 className="text-2xl font-medium tracking-tight text-[#1C1C1E]">Good afternoon</h1>
        <p className="text-[#636366] mt-2 tracking-wide">
          Welcome to your command center, {organization?.name}
        </p>
      </div>
      
      <div className="rounded-xl bg-[#FAFAFA] p-6 border border-gray-100 transition-all duration-300">
        <AICopilot />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl bg-white p-6 border border-gray-100 shadow-sm transition-all duration-300">
          <BusinessPerformanceWidget />
        </div>
        <div className="space-y-8">
          <div className="rounded-xl bg-white p-6 border border-gray-100 shadow-sm transition-all duration-300">
            <NotificationsWidget />
          </div>
          <div className="rounded-xl bg-white p-6 border border-gray-100 shadow-sm transition-all duration-300">
            <InsightsWidget />
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-xl font-medium mb-6 text-[#1C1C1E] tracking-tight">Module Widgets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for future module widgets */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-white transition-all duration-300 hover:shadow-sm">
              <p className="text-[#636366]">Module Widget {i}</p>
              <p className="text-xs text-gray-400 mt-2 tracking-wide">
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
