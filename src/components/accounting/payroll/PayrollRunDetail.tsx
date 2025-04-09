
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { useToast } from "@/hooks/use-toast";
import { PayrollRun, PayrollItem } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollStatusBadge } from "./PayrollStatusBadge";
import { PayrollItemDialog } from "./PayrollItemDialog";
import { CurrencyDisplay } from "../CurrencyDisplay";
import { Loader2, FilePlus, FileEdit, FileX, Download, Send, CheckCircle, MoreVertical, User, Calendar, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PayrollRunDetailProps {
  payrollRunId: string;
  onUpdate?: () => void;
}

export function PayrollRunDetail({ payrollRunId, onUpdate }: PayrollRunDetailProps) {
  const { 
    getPayrollRunById, 
    getPayrollItemsByRunId, 
    processPayrollRun, 
    finalizePayrollRun, 
    deletePayrollRun,
    exportPayrollRun
  } = useAccounting();
  const { toast } = useToast();
  
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  
  // Fetch payroll run data
  const fetchPayrollRun = async () => {
    setLoading(true);
    try {
      const run = await getPayrollRunById(payrollRunId);
      if (run) {
        setPayrollRun(run);
        const items = await getPayrollItemsByRunId(payrollRunId);
        setPayrollItems(items);
      }
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll run details."
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPayrollRun();
  }, [payrollRunId]);
  
  const handleProcess = async () => {
    if (!payrollRun) return;
    
    setProcessing(true);
    try {
      await processPayrollRun(payrollRun.id);
      fetchPayrollRun();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error processing payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process payroll run."
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleFinalize = async () => {
    if (!payrollRun) return;
    
    setProcessing(true);
    try {
      await finalizePayrollRun(payrollRun.id);
      fetchPayrollRun();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error finalizing payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to finalize payroll run."
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    if (!payrollRun) return;
    
    try {
      const data = await exportPayrollRun(payrollRun.id, format);
      
      // In a real app, this would trigger a download
      // For this example, we'll just show a success message
      toast({
        title: `Export successful`,
        description: `Payroll run exported in ${format.toUpperCase()} format.`
      });
      
      // For JSON, we could display it in a new window
      if (format === 'json') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.open(url);
      }
    } catch (error) {
      console.error("Error exporting payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export payroll run."
      });
    }
  };
  
  const handleDelete = async () => {
    if (!payrollRun) return;
    
    if (confirm(`Are you sure you want to delete this payroll run: ${payrollRun.name}?`)) {
      try {
        await deletePayrollRun(payrollRun.id);
        if (onUpdate) onUpdate();
        toast({
          title: "Payroll run deleted",
          description: "The payroll run has been successfully deleted."
        });
      } catch (error) {
        console.error("Error deleting payroll run:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete payroll run."
        });
      }
    }
  };
  
  const handleAddItem = () => {
    setSelectedPayrollItem(null);
    setShowAddItemDialog(true);
  };
  
  const handleEditItem = (item: PayrollItem) => {
    setSelectedPayrollItem(item);
    setShowAddItemDialog(true);
  };
  
  const handleItemDialogClose = (updated: boolean) => {
    setShowAddItemDialog(false);
    setSelectedPayrollItem(null);
    if (updated) {
      fetchPayrollRun();
      if (onUpdate) onUpdate();
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!payrollRun) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Payroll run not found. It may have been deleted or you don't have access.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">{payrollRun.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(payrollRun.periodStart), "MMM d, yyyy")} - {format(new Date(payrollRun.periodEnd), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <PayrollStatusBadge status={payrollRun.status} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              {payrollRun.status === 'draft' && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <FileX className="h-4 w-4 mr-2" />
                  Delete Payroll Run
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{payrollRun.employeeCount}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gross Amount</p>
                <p className="text-2xl font-bold"><CurrencyDisplay amount={payrollRun.grossAmount} /></p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deductions & Taxes</p>
                <p className="text-2xl font-bold"><CurrencyDisplay amount={payrollRun.taxAmount + payrollRun.deductionAmount} /></p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p className="text-2xl font-bold"><CurrencyDisplay amount={payrollRun.netAmount} /></p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payroll Items</CardTitle>
              <CardDescription>Employees included in this payroll run</CardDescription>
            </div>
            <div className="flex gap-2">
              {payrollRun.status === 'draft' && (
                <Button variant="outline" onClick={handleAddItem}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              )}
              
              {payrollRun.status === 'draft' && (
                <Button 
                  onClick={handleProcess} 
                  disabled={processing || payrollItems.length === 0}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Process Payroll
                    </>
                  )}
                </Button>
              )}
              
              {payrollRun.status === 'processing' && (
                <Button 
                  onClick={handleFinalize} 
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalize Payroll
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payrollItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
              No employees have been added to this payroll run yet.
              {payrollRun.status === 'draft' && (
                <div className="mt-4">
                  <Button onClick={handleAddItem} variant="outline">
                    <FilePlus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Tax Amount</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  {payrollRun.status === 'draft' && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                    <TableCell><CurrencyDisplay amount={item.grossSalary} /></TableCell>
                    <TableCell><CurrencyDisplay amount={item.taxAmount} /></TableCell>
                    <TableCell><CurrencyDisplay amount={item.deductionAmount} /></TableCell>
                    <TableCell><CurrencyDisplay amount={item.netSalary} /></TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.status === 'processed' ? 'default' : item.status === 'error' ? 'destructive' : 'outline'}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    {payrollRun.status === 'draft' && (
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditItem(item)}
                        >
                          <FileEdit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {payrollRun.notes && (
          <CardFooter className="flex flex-col items-start">
            <Separator className="mb-4" />
            <div>
              <h4 className="font-medium text-sm mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground">{payrollRun.notes}</p>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <PayrollItemDialog 
          payrollRun={payrollRun}
          payrollItem={selectedPayrollItem}
          onClose={handleItemDialogClose}
        />
      </Dialog>
    </div>
  );
}
