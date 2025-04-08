
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Invoice } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
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

export function InvoicesOverview() {
  const { getInvoices } = useAccounting();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    getInvoices()
      .then((fetchedInvoices) => {
        const sampleInvoices: Invoice[] = [
          {
            id: "1",
            invoiceNumber: "INV-001",
            customerId: "customer-1",
            customerName: "Acme Corp",
            issueDate: "2025-03-01",
            dueDate: "2025-04-01",
            items: [
              {
                id: "item-1",
                description: "Website Design",
                quantity: 1,
                unitPrice: 1200,
                taxRate: 10,
                amount: 1200,
              },
            ],
            subtotal: 1200,
            taxAmount: 120,
            total: 1320,
            status: "sent",
            createdAt: "2025-03-01T12:00:00Z",
            updatedAt: "2025-03-01T12:00:00Z",
          },
          {
            id: "2",
            invoiceNumber: "INV-002",
            customerId: "customer-2",
            customerName: "Globex Inc",
            issueDate: "2025-03-05",
            dueDate: "2025-04-05",
            items: [
              {
                id: "item-2",
                description: "Monthly Maintenance",
                quantity: 1,
                unitPrice: 500,
                taxRate: 10,
                amount: 500,
              },
            ],
            subtotal: 500,
            taxAmount: 50,
            total: 550,
            status: "paid",
            createdAt: "2025-03-05T14:30:00Z",
            updatedAt: "2025-03-10T09:15:00Z",
          },
          {
            id: "3",
            invoiceNumber: "INV-003",
            customerId: "customer-3",
            customerName: "ABC Enterprises",
            issueDate: "2025-03-10",
            dueDate: "2025-04-10",
            items: [
              {
                id: "item-3",
                description: "Custom Development",
                quantity: 20,
                unitPrice: 120,
                taxRate: 10,
                amount: 2400,
              },
            ],
            subtotal: 2400,
            taxAmount: 240,
            total: 2640,
            status: "draft",
            createdAt: "2025-03-10T16:45:00Z",
            updatedAt: "2025-03-10T16:45:00Z",
          },
          {
            id: "4",
            invoiceNumber: "INV-004",
            customerId: "customer-1",
            customerName: "Acme Corp",
            issueDate: "2025-03-15",
            dueDate: "2025-04-15",
            items: [
              {
                id: "item-4",
                description: "Consulting Services",
                quantity: 5,
                unitPrice: 200,
                taxRate: 10,
                amount: 1000,
              },
            ],
            subtotal: 1000,
            taxAmount: 100,
            total: 1100,
            status: "overdue",
            createdAt: "2025-03-15T10:20:00Z",
            updatedAt: "2025-03-15T10:20:00Z",
          },
        ];
        setInvoices(sampleInvoices);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching invoices:", error);
        toast({
          variant: "destructive",
          title: "Failed to load invoices",
          description: "Please try again later",
        });
        setIsLoading(false);
      });
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeFilter && invoice.status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customerId.toLowerCase().includes(query) ||
        invoice.total.toString().includes(query)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">Invoices</h2>
          <p className="text-muted-foreground">
            Create and manage invoices for your customers
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
          variant={activeFilter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("overdue")}
        >
          Overdue ({statusCounts["overdue"] || 0})
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
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
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
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerId}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
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
      />
    </div>
  );
}
