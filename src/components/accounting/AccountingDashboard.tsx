
import { useAccounting } from "@/modules/accounting";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, DollarSign, FileText, CreditCard } from "lucide-react";

export function AccountingDashboard() {
  const { state } = useAccounting();
  
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (state.isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium">Failed to load accounting module</h3>
            <p className="text-muted-foreground mt-2">
              There was an error loading the accounting data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If module is not enabled or no config exists
  if (!state.config || !state.config.isEnabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Accounting Module Not Activated</h3>
            <p className="text-muted-foreground mt-2">
              The accounting module is not enabled for your organization.
            </p>
            <Button className="mt-4">Activate Module</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${50000}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${20000}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${30000}</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Latest invoices from your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Invoice #{1000 + i}</p>
                    <p className="text-sm text-muted-foreground">Customer {i}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-medium">${1000 * i}</p>
                    <Badge variant={i === 3 ? "destructive" : i === 2 ? "secondary" : "default"}>
                      {i === 3 ? "Overdue" : i === 2 ? "Pending" : "Paid"}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>
              Latest bills to be paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Bill #{2000 + i}</p>
                    <p className="text-sm text-muted-foreground">Vendor {i}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-medium">${500 * i}</p>
                    <Badge variant={i === 1 ? "destructive" : i === 2 ? "secondary" : "default"}>
                      {i === 1 ? "Overdue" : i === 2 ? "Pending" : "Paid"}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                View All Bills
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
