import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Invoice } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { NewInvoiceDialog } from "./NewInvoiceDialog";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceDetail } from "./InvoiceDetail";
import { Card } from "@/components/ui/card";

export function InvoicesOverview() {
  const { getInvoices } = useAccounting();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Load invoices method
  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const fetchedInvoices = await getInvoices();
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Failed to load invoices",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleInvoiceCreated = (newInvoice: Invoice) => {
    setInvoices((current) => [newInvoice, ...current]);
  };

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeFilter && invoice.status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.customerName.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const statusCounts = invoices.reduce(
    (acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // If an invoice is selected, show its detail view
  if (selectedInvoiceId) {
    return (
      <InvoiceDetail 
        invoiceId={selectedInvoiceId} 
        onBack={() => {
          setSelectedInvoiceId(null);
          loadInvoices(); // Refresh the list to get any updates
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">Invoices</h2>
          <p className="text-muted-foreground">
            Manage your invoices and track payments
          </p>
        </div>
        <Button onClick={() => setShowNewInvoiceDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      <div className="flex space-x-2 pb-2 border-b">
        <Button
          variant={activeFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter(null)}
        >
          All ({invoices.length})
        </Button>
        <Button
          variant={activeFilter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("draft")}
        >
          Draft ({statusCounts["draft"] || 0})
        </Button>
        <Button
          variant={activeFilter === "sent" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("sent")}
        >
          Sent ({statusCounts["sent"] || 0})
        </Button>
        <Button
          variant={activeFilter === "paid" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("paid")}
        >
          Paid ({statusCounts["paid"] || 0})
        </Button>
        <Button
          variant={activeFilter === "partially_paid" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("partially_paid")}
        >
          Partially Paid ({statusCounts["partially_paid"] || 0})
        </Button>
        <Button
          variant={activeFilter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("overdue")}
        >
          Overdue ({statusCounts["overdue"] || 0})
        </Button>
        <Button
          variant={activeFilter === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("cancelled")}
        >
          Cancelled ({statusCounts["cancelled"] || 0})
        </Button>
      </div>

      <div className="flex justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => loadInvoices()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p>Loading invoices...</p>
        </div>
      ) : paginatedInvoices.length === 0 ? (
        <div className="h-64 flex items-center justify-center flex-col bg-white rounded-lg border p-6">
          <p className="text-muted-foreground mb-4">No invoices found</p>
          <Button onClick={() => setShowNewInvoiceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Invoice
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewInvoice(invoice.id)}
                >
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      <NewInvoiceDialog
        open={showNewInvoiceDialog}
        onOpenChange={setShowNewInvoiceDialog}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}
