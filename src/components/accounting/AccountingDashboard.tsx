
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  CreditCard, 
  BarChart2, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Revenue</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={50000} /></div>
            <div className="flex items-center mt-1">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3"/> 
                <span>20.1%</span>
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Expenses</span>
              <CreditCard className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={20000} /></div>
            <div className="flex items-center mt-1">
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3"/> 
                <span>12.5%</span>
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Net Profit</span>
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={30000} /></div>
            <div className="flex items-center mt-1">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3"/> 
                <span>15.3%</span>
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Tax Liability</span>
              <PieChart className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={7500} /></div>
            <div className="flex items-center mt-1">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3"/> 
                <span>8.4%</span>
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last quarter</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Revenue and expense trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AspectRatio ratio={16 / 6} className="bg-slate-50 rounded-md">
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Financial chart coming soon</p>
              </div>
            </AspectRatio>
          </CardContent>
        </Card>
        
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
                <div key={i} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">Invoice #{1000 + i}</p>
                    <p className="text-sm text-muted-foreground">Customer {i}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-medium"><CurrencyDisplay amount={1000 * i} /></p>
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
                <div key={i} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">Bill #{2000 + i}</p>
                    <p className="text-sm text-muted-foreground">Vendor {i}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-medium"><CurrencyDisplay amount={500 * i} /></p>
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
