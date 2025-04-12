
import { useState, useEffect } from "react";
import { DashboardStats } from "./dashboard/DashboardStats";
import { FinancialInsights } from "./dashboard/FinancialInsights";
import { DashboardLoadingState } from "./dashboard/DashboardLoadingState";
import { DashboardErrorState } from "./dashboard/DashboardErrorState";
import { DashboardInactiveState } from "./dashboard/DashboardInactiveState";

export function AccountingDashboard() {
  const [state, setState] = useState({
    isLoading: false,
    isError: false,
    config: {
      isEnabled: true,
      defaultCurrency: 'USD'
    }
  });
  
  // Try to use the accounting context, but handle errors gracefully
  useEffect(() => {
    const loadAccountingState = async () => {
      try {
        // Import dynamically to avoid the error at component render time
        const { useAccounting } = await import("@/modules/accounting");
        const { state: accountingState } = useAccounting();
        setState(accountingState);
      } catch (error) {
        console.error("Could not load accounting module:", error);
        setState(prev => ({ ...prev, isError: true }));
      }
    };
    
    loadAccountingState();
  }, []);
  
  if (state.isLoading) {
    return <DashboardLoadingState />;
  }
  
  if (state.isError) {
    return <DashboardErrorState />;
  }
  
  // If module is not enabled or no config exists
  if (!state.config || !state.config.isEnabled) {
    return <DashboardInactiveState />;
  }
  
  return (
    <div className="space-y-6">
      <DashboardStats />
      <FinancialInsights />
    </div>
  );
}
