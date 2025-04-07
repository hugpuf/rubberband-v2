import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill } from "@/modules/accounting/types";
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
import { NewBillDialog } from "./NewBillDialog";
import { BillStatusBadge } from "./BillStatusBadge";

export function BillsOverview() {
  const { getBills } = useAccounting();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNewBillDialog, setShowNewBillDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    getBills()
      .then((fetchedBills) => {
        const sampleBills: Bill[] = [
          {
            id: "1",
            billNumber: "BILL-001",
            vendorId: "vendor-1",
            issueDate: "2025-03-01",
            dueDate: "2025-04-01",
            items: [
              {
                id: "item-1",
                description: "Office Supplies",
                quantity: 1,
                unitPrice: 250,
                taxRate: 10,
                amount: 250,
              },
            ],
            subtotal: 250,
            taxAmount: 25,
            total: 275,
            status: "pending",
            createdAt: "2025-03-01T12:00:00Z",
            updatedAt: "2025-03-01T12:00:00Z",
          },
          {
            id: "2",
            billNumber: "BILL-002",
            vendorId: "vendor-2",
            issueDate: "2025-03-05",
            dueDate: "2025-04-05",
            items: [
              {
                id: "item-2",
                description: "Software Subscription",
                quantity: 1,
                unitPrice: 99,
                taxRate: 10,
                amount: 99,
              },
            ],
            subtotal: 99,
            taxAmount: 9.9,
            total: 108.9,
            status: "paid",
            createdAt: "2025-03-05T14:30:00Z",
            updatedAt: "2025-03-10T09:15:00Z",
          },
          {
            id: "3",
            billNumber: "BILL-003",
            vendorId: "vendor-3",
            issueDate: "2025-03-10",
            dueDate: "2025-04-10",
            items: [
              {
                id: "item-3",
                description: "Consulting Services",
                quantity: 5,
                unitPrice: 150,
                taxRate: 10,
                amount: 750,
              },
            ],
            subtotal: 750,
            taxAmount: 75,
            total: 825,
            status: "draft",
            createdAt: "2025-03-10T16:45:00Z",
            updatedAt: "2025-03-10T16:45:00Z",
          },
          {
            id: "4",
            billNumber: "BILL-004",
            vendorId: "vendor-1",
            issueDate: "2025-03-15",
            dueDate: "2025-04-15",
            items: [
              {
                id: "item-4",
                description: "Equipment Rental",
                quantity: 1,
                unitPrice: 500,
                taxRate: 10,
                amount: 500,
              },
            ],
            subtotal: 500,
            taxAmount: 50,
            total: 550,
            status: "overdue",
            createdAt: "2025-03-15T10:20:00Z",
            updatedAt: "2025-03-15T10:20:00Z",
          },
        ];
        setBills(sampleBills);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching bills:", error);
        toast({
          variant: "destructive",
          title: "Failed to load bills",
          description: "Please try again later",
        });
        setIsLoading(false);
      });
  }, []);

  const filteredBills = bills.filter((bill) => {
    if (activeFilter && bill.status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bill.billNumber.toLowerCase().includes(query) ||
        bill.vendorId.toLowerCase().includes(query) ||
        bill.total.toString().includes(query)
      );
    }
    
    return true;
  });

  const statusCounts = bills.reduce(
    (acc, bill) => {
      acc[bill.status] = (acc[bill.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">Bills</h2>
          <p className="text-muted-foreground">
            Manage and track your organization's expenses
          </p>
        </div>
        <Button onClick={() => setShowNewBillDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Bill
        </Button>
      </div>

      <div className="flex space-x-2 pb-2 border-b">
        <Button
          variant={activeFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter(null)}
        >
          All ({bills.length})
        </Button>
        <Button
          variant={activeFilter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("draft")}
        >
          Draft ({statusCounts["draft"] || 0})
        </Button>
        <Button
          variant={activeFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("pending")}
        >
          Awaiting Payment ({statusCounts["pending"] || 0})
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
            placeholder="Search bills..."
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
          <p>Loading bills...</p>
        </div>
      ) : paginatedBills.length === 0 ? (
        <div className="h-64 flex items-center justify-center flex-col bg-white rounded-lg border p-6">
          <p className="text-muted-foreground mb-4">No bills found</p>
          <Button onClick={() => setShowNewBillDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Bill
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBills.map((bill) => (
                <TableRow key={bill.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.vendorId}</TableCell>
                  <TableCell>
                    <BillStatusBadge status={bill.status} />
                  </TableCell>
                  <TableCell>{new Date(bill.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(bill.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">${bill.total.toFixed(2)}</TableCell>
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

      <NewBillDialog
        open={showNewBillDialog}
        onOpenChange={setShowNewBillDialog}
      />
    </div>
  );
}
