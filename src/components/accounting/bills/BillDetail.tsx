
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BillStatusBadge } from "./BillStatusBadge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Download, 
  Pencil, 
  Trash2, 
  CreditCard,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditBillDialog } from "./EditBillDialog";

interface BillDetailProps {
  billId: string;
  onBack: () => void;
}

export function BillDetail({ billId, onBack }: BillDetailProps) {
  const { getBills, updateBill, deleteBill } = useAccounting();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBill();
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
        description: "There was a problem loading the bill details"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Bill['status']) => {
    if (!bill) return;

    try {
      const updatedBill = await updateBill(bill.id, { status: newStatus });
      setBill(updatedBill);
      toast({
        title: "Status updated",
        description: `Bill status changed to ${newStatus}`
      });
    } catch (error) {
      console.error("Error updating bill status:", error);
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "There was a problem updating the bill status"
      });
    }
  };

  const handleDeleteBill = async () => {
    if (!bill) return;
    
    setIsDeleting(true);
    try {
      await deleteBill(bill.id);
      toast({
        title: "Bill deleted",
        description: "The bill has been successfully deleted"
      });
      onBack();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete bill",
        description: "There was a problem deleting the bill"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Bills
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p>Bill not found</p>
              <Button variant="outline" className="mt-4" onClick={onBack}>
                Return to Bills List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Bills
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-2xl">Bill #{bill.billNumber}</CardTitle>
                <CardDescription>Created on {new Date(bill.createdAt).toLocaleDateString()}</CardDescription>
              </div>
              <BillStatusBadge status={bill.status} className="h-6" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Bill Date</h3>
                  <p>{new Date(bill.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                  <p>{new Date(bill.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                  <p className="font-medium">${bill.total.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Vendor</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{bill.vendorName}</p>
                  <p className="text-sm text-muted-foreground">Vendor ID: {bill.vendorId}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax (%)</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.taxRate}%</TableCell>
                        <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${bill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${bill.taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${bill.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {bill.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{bill.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bill.status === 'draft' && (
                  <Button 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('pending')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </Button>
                )}
                
                {(bill.status === 'draft' || bill.status === 'pending' || bill.status === 'overdue') && (
                  <Button 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('paid')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                
                {bill.status === 'paid' && (
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleStatusChange('pending')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </Button>
                )}
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium"><BillStatusBadge status={bill.status} /></p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Due</p>
                  <p className="font-medium">{new Date(bill.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Due</p>
                  <p className="font-medium">${bill.total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditBillDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        bill={bill}
        onBillUpdated={handleBillUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete bill #{bill.billNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteBill}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
