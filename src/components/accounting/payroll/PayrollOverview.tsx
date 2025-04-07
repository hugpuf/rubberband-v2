
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounting } from "@/modules/accounting";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Download, Filter, Calendar, Search } from "lucide-react";
import { PayrollStatusBadge } from "./PayrollStatusBadge";
import { CurrencyDisplay } from "../CurrencyDisplay";
import { PayrollRun } from "@/modules/accounting/types";

export function PayrollOverview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // This would come from your payroll module in a real implementation
  const payrollData: PayrollRun[] = [
    {
      id: "pr-001",
      name: "Monthly Payroll - March",
      period: "Mar 1-31, 2025",
      status: "completed",
      employeeCount: 12,
      grossAmount: 45000,
      netAmount: 36000,
      paymentDate: "2025-03-31",
      createdAt: "2025-03-01",
      updatedAt: "2025-03-31"
    },
    {
      id: "pr-002",
      name: "Monthly Payroll - February",
      period: "Feb 1-28, 2025",
      status: "completed",
      employeeCount: 12,
      grossAmount: 44500,
      netAmount: 35600,
      paymentDate: "2025-02-28",
      createdAt: "2025-02-01",
      updatedAt: "2025-02-28"
    },
    {
      id: "pr-003",
      name: "Monthly Payroll - January",
      period: "Jan 1-31, 2025",
      status: "completed",
      employeeCount: 11,
      grossAmount: 41000,
      netAmount: 32800,
      paymentDate: "2025-01-31",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-31"
    },
    {
      id: "pr-004",
      name: "Monthly Payroll - April",
      period: "Apr 1-30, 2025",
      status: "draft",
      employeeCount: 12,
      grossAmount: 45500,
      netAmount: 36400,
      paymentDate: "2025-04-30",
      createdAt: "2025-04-01",
      updatedAt: "2025-04-01"
    }
  ];

  const handleCreatePayroll = () => {
    toast({
      title: "Feature coming soon",
      description: "Payroll creation functionality will be available in a future update."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">Payroll Runs</h2>
          <p className="text-muted-foreground">Manage employee compensation and payments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => toast({
              title: "Feature coming soon",
              description: "Advanced filtering will be available in a future update."
            })}
          >
            <Filter size={16} />
            Filter
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => toast({
              title: "Feature coming soon",
              description: "Export functionality will be available in a future update."
            })}
          >
            <Download size={16} />
            Export
          </Button>
          <Button 
            className="flex items-center gap-1" 
            onClick={handleCreatePayroll}
          >
            <Plus size={16} />
            New Payroll Run
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <Card className="w-1/4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Employees</div>
            <div className="text-2xl font-bold mt-1">12</div>
          </CardContent>
        </Card>
        <Card className="w-1/4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Monthly Payroll</div>
            <div className="text-2xl font-bold mt-1"><CurrencyDisplay amount={45500} /></div>
          </CardContent>
        </Card>
        <Card className="w-1/4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">YTD Payroll</div>
            <div className="text-2xl font-bold mt-1"><CurrencyDisplay amount={167000} /></div>
          </CardContent>
        </Card>
        <Card className="w-1/4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Upcoming Payments</div>
            <div className="text-2xl font-bold mt-1">1</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payrolls..."
              className="pl-8 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Calendar size={16} />
              Last 90 days
            </Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payroll Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Gross Amount</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead>Payment Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollData.map((payroll) => (
              <TableRow key={payroll.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{payroll.name}</TableCell>
                <TableCell>{payroll.period}</TableCell>
                <TableCell>
                  <PayrollStatusBadge status={payroll.status} />
                </TableCell>
                <TableCell>{payroll.employeeCount}</TableCell>
                <TableCell><CurrencyDisplay amount={payroll.grossAmount} /></TableCell>
                <TableCell><CurrencyDisplay amount={payroll.netAmount} /></TableCell>
                <TableCell>{new Date(payroll.paymentDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
