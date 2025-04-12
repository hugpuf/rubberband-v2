
import { FileText, CreditCard } from "lucide-react";
import { DocumentsList } from "./DocumentsList";
import { FinancialChart } from "./FinancialChart";

export function FinancialInsights() {
  // Sample data for invoices and bills
  const invoices = [
    { id: 1, name: "Invoice #1001", entity: "Customer 1", amount: 1000, status: "Paid" as const },
    { id: 2, name: "Invoice #1002", entity: "Customer 2", amount: 2000, status: "Pending" as const },
    { id: 3, name: "Invoice #1003", entity: "Customer 3", amount: 3000, status: "Overdue" as const },
  ];

  const bills = [
    { id: 1, name: "Bill #2001", entity: "Vendor 1", amount: 500, status: "Overdue" as const },
    { id: 2, name: "Bill #2002", entity: "Vendor 2", amount: 1000, status: "Pending" as const },
    { id: 3, name: "Bill #2003", entity: "Vendor 3", amount: 1500, status: "Paid" as const },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FinancialChart />
      
      <DocumentsList
        title="Recent Invoices"
        description="Latest invoices from your customers"
        items={invoices}
        icon={FileText}
        viewAllText="View All Invoices"
      />
      
      <DocumentsList
        title="Recent Bills"
        description="Latest bills to be paid"
        items={bills}
        icon={CreditCard}
        viewAllText="View All Bills"
      />
    </div>
  );
}
