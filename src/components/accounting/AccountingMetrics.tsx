
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { useAccounting } from "@/modules/accounting";
import { useState, useEffect } from "react";

export function AccountingMetrics() {
  // Add error handling for the hook
  const [hookError, setHookError] = useState<Error | null>(null);
  
  // Placeholder data - in a real app, this would come from your accounting module
  const [metrics, setMetrics] = useState({
    outstandingInvoices: {
      amount: 12756.00,
      count: 21,
      label: "Outstanding Invoices",
      description: "invoices pending"
    },
    accountsPayable: {
      amount: 5420.35,
      count: 12,
      label: "Accounts Payable",
      description: "bills to pay"
    },
    bankBalance: {
      amount: 47582.19,
      lastReconciled: "Yesterday",
      label: "Bank Balance",
      description: "Last reconciled"
    }
  });

  // Try to use the accounting context if available
  useEffect(() => {
    try {
      const { state } = useAccounting();
      console.log("Accounting state loaded:", state);
      // Here you could update the metrics based on state
    } catch (error) {
      console.error("Error accessing accounting context:", error);
      setHookError(error as Error);
    }
  }, []);

  // If there's an error with the hook, we'll still show the metrics with placeholder data
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="border border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">{metrics.outstandingInvoices.label}</p>
            <p className="text-3xl font-bold">
              <CurrencyDisplay amount={metrics.outstandingInvoices.amount} />
            </p>
            <p className="text-sm text-gray-500">
              {metrics.outstandingInvoices.count} {metrics.outstandingInvoices.description}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">{metrics.accountsPayable.label}</p>
            <p className="text-3xl font-bold">
              <CurrencyDisplay amount={metrics.accountsPayable.amount} />
            </p>
            <p className="text-sm text-gray-500">
              {metrics.accountsPayable.count} {metrics.accountsPayable.description}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">{metrics.bankBalance.label}</p>
            <p className="text-3xl font-bold">
              <CurrencyDisplay amount={metrics.bankBalance.amount} />
            </p>
            <p className="text-sm text-gray-500">
              {metrics.bankBalance.description}: {metrics.bankBalance.lastReconciled}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
