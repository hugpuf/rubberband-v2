
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";
import { ChartOfAccounts } from "@/components/accounting/ChartOfAccounts";
import { BillsOverview } from "@/components/accounting/bills/BillsOverview";
import { InvoicesOverview } from "@/components/accounting/invoices/InvoicesOverview";
import { AccountingMetrics } from "@/components/accounting/AccountingMetrics";
import { useOrganization } from "@/hooks/useOrganization";
import { useState } from "react";
import { logUserAction } from "@/services/userLogs";

const Accounting = () => {
  const { isAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Log page view and tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    logUserAction({
      module: "accounting",
      action: "navigate",
      metadata: { tab: value }
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-[#1C1C1E]">Accounts</h1>
        <p className="text-[#636366] mt-2 tracking-wide">
          Manage your financial operations
        </p>
      </div>
      
      {/* Key Metrics Dashboard */}
      <AccountingMetrics />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 bg-[#F5F5F7] p-1 rounded-lg">
          <TabsTrigger 
            value="dashboard" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="accounts" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger 
            value="invoices" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger 
            value="bills" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Bills
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-normal"
          >
            Reports
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <AccountingDashboard />
        </TabsContent>
        <TabsContent value="accounts">
          <ChartOfAccounts />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesOverview />
        </TabsContent>
        <TabsContent value="bills">
          <BillsOverview />
        </TabsContent>
        <TabsContent value="reports">
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border p-6">
            <p className="text-muted-foreground">Financial reports coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;
