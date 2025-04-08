import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Invoice } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash, Printer, Send, Clock, CheckCircle } from "lucide-react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { EditInvoiceDialog } from "./EditInvoiceDialog";

interface InvoiceDetailProps {
  invoiceId: string;
  onBack: () => void;
}

export function InvoiceDetail({ invoiceId, onBack }: InvoiceDetailProps) {
  const { getInvoices, updateInvoice, deleteInvoice } = useAccounting();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      setIsLoading(true);
      try {
        const invoices = await getInvoices();
        const foundInvoice = invoices.find(i => i.id === invoiceId);
        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          toast({
            variant: "destructive",
            title: "Invoice not found",
            description: "Could not find the requested invoice"
          });
          onBack();
        }
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invoice details"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId, getInvoices, toast, onBack]);

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice) return;
    
    setIsStatusUpdateLoading(true);
    try {
      const updatedInvoice = await updateInvoice(invoice.id, { status: newStatus });
      setInvoice(updatedInvoice);
      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}`
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invoice status"
      });
    } finally {
      setIsStatusUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteInvoice(invoice.id);
      if (success) {
        toast({
          title: "Invoice deleted",
          description: "The invoice has been deleted successfully"
        });
        onBack();
      } else {
        throw new Error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the invoice"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
          <h2 className="text-xl font-medium">Invoice {invoice?.invoiceNumber}</h2>
          {invoice && <InvoiceStatusBadge status={invoice.status} />}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading invoice details...</p>
        </div>
      ) : !invoice ? (
        <div className="flex items-center justify-center h-64">
          <p>Invoice not found</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                <p className="text-base">{invoice.customerName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                <p className="text-base">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Issue Date</h3>
                <p className="text-base">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                <p className="text-base">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Items</h3>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">Tax Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3 text-sm">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.taxRate}%</td>
                        <td className="px-4 py-3 text-sm text-right">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-y-1 text-sm">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <div>Subtotal:</div>
                  <div>${invoice.subtotal.toFixed(2)}</div>
                </div>
                <div className="flex justify-between py-1">
                  <div>Tax:</div>
                  <div>${invoice.taxAmount.toFixed(2)}</div>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between py-1 font-medium">
                  <div>Total:</div>
                  <div>${invoice.total.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Created: {new Date(invoice.createdAt).toLocaleString()}
              {invoice.createdAt !== invoice.updatedAt && 
                ` | Last updated: ${new Date(invoice.updatedAt).toLocaleString()}`
              }
            </div>
            <div className="flex space-x-2">
              {invoice.status === 'draft' && (
                <Button 
                  size="sm"
                  onClick={() => handleStatusChange('sent')}
                  disabled={isStatusUpdateLoading}
                >
                  <Send className="mr-2 h-4 w-4" /> Mark as Sent
                </Button>
              )}
              {invoice.status === 'sent' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('overdue')}
                    disabled={isStatusUpdateLoading}
                  >
                    <Clock className="mr-2 h-4 w-4" /> Mark as Overdue
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleStatusChange('paid')}
                    disabled={isStatusUpdateLoading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                  </Button>
                </>
              )}
              {invoice.status === 'overdue' && (
                <Button 
                  size="sm"
                  onClick={() => handleStatusChange('paid')}
                  disabled={isStatusUpdateLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Edit Invoice Dialog */}
      {invoice && (
        <EditInvoiceDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          invoice={invoice}
          onInvoiceUpdated={(updatedInvoice) => setInvoice(updatedInvoice)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
