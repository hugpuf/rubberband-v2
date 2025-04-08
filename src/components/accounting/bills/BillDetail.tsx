
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill, BillItem, Account } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash, FileText, Calendar, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BillStatusBadge } from "./BillStatusBadge";
import { EditBillDialog } from "./EditBillDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BillDetailProps {
  billId: string;
  onBack: () => void;
}

export function BillDetail({ billId, onBack }: BillDetailProps) {
  const { getBills, deleteBill, updateBill, getAccounts } = useAccounting();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBill();
    fetchAccounts();
  }, [billId]);

  const fetchBill = async () => {
    setIsLoading(true);
    try {
      const bills = await getBills();
      const foundBill = bills.find(b => b.id === billId);
      
      if (foundBill) {
        setBill(foundBill);
      } else {
        toast({
          variant: "destructive",
          title: "Bill not found",
          description: "The requested bill could not be found"
        });
        onBack();
      }
    } catch (error) {
      console.error("Error fetching bill:", error);
      toast({
        variant: "destructive",
        title: "Error loading bill",
        description: "There was an error loading the bill details"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const fetchedAccounts = await getAccounts();
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleDeleteBill = async () => {
    if (!bill) return;
    
    try {
      const success = await deleteBill(bill.id);
      
      if (success) {
        toast({
          title: "Bill deleted",
          description: `Bill ${bill.billNumber} has been deleted`
        });
        onBack();
      } else {
        throw new Error("Failed to delete bill");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the bill"
      });
    }
  };

  const handleUpdateBillStatus = async (status: string) => {
    if (!bill) return;
    
    try {
      const updatedBill = await updateBill(bill.id, { status: status as any });
      
      if (updatedBill) {
        setBill(updatedBill);
        toast({
          title: "Status updated",
          description: `Bill has been marked as ${status}`
        });
      } else {
        throw new Error("Failed to update bill status");
      }
    } catch (error) {
      console.error("Error updating bill status:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update bill status"
      });
    }
  };

  const handleBillUpdated = (updatedBill: Bill) => {
    setBill(updatedBill);
    setShowEditDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading bill details...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Bill not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bills
          </Button>
          <h2 className="text-xl font-medium">Bill #{bill.billNumber}</h2>
          <BillStatusBadge status={bill.status} />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete Bill #{bill.billNumber}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBill}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{bill.vendorName}</div>
            <div className="text-sm text-muted-foreground mt-2">Vendor ID: {bill.vendorId}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Issued: {new Date(bill.issueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bill.total.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Subtotal: ${bill.subtotal.toFixed(2)} + Tax: ${bill.taxAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.items.map((item: BillItem) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.taxRate}%</TableCell>
                  <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 space-x-4">
            <div className="text-right">
              <div className="text-sm">Subtotal</div>
              <div className="text-sm">Tax</div>
              <div className="font-semibold mt-1">Total</div>
            </div>
            <div className="text-right">
              <div className="text-sm">${bill.subtotal.toFixed(2)}</div>
              <div className="text-sm">${bill.taxAmount.toFixed(2)}</div>
              <div className="font-semibold mt-1">${bill.total.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {bill.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{bill.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateBillStatus('draft')}
              disabled={bill.status === 'draft'}
            >
              Mark as Draft
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateBillStatus('pending')}
              disabled={bill.status === 'pending'}
            >
              Mark as Awaiting Payment
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleUpdateBillStatus('paid')}
              disabled={bill.status === 'paid'}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateBillStatus('overdue')}
              disabled={bill.status === 'overdue'}
            >
              Mark as Overdue
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateBillStatus('cancelled')}
              disabled={bill.status === 'cancelled'}
            >
              Mark as Cancelled
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditBillDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        bill={bill}
        accounts={accounts}
        onBillUpdated={handleBillUpdated}
      />
    </div>
  );
}
