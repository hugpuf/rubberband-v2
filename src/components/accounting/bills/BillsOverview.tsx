
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill } from "@/modules/accounting/types";
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
import { NewBillDialog } from "./NewBillDialog";
import { BillStatusBadge } from "./BillStatusBadge";
import { BillDetail } from "./BillDetail";

export function BillsOverview() {
  const { getBills } = useAccounting();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNewBillDialog, setShowNewBillDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const fetchedBills = await getBills();
      setBills(fetchedBills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({
        variant: "destructive",
        title: "Failed to load bills",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillCreated = (newBill: Bill) => {
    setBills((current) => [newBill, ...current]);
  };

  const handleViewBill = (billId: string) => {
    setSelectedBillId(billId);
  };

  const filteredBills = bills.filter((bill) => {
    if (activeFilter && bill.status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bill.billNumber.toLowerCase().includes(query) ||
        bill.vendorName.toLowerCase().includes(query) ||
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

  // If a bill is selected, show its detail view
  if (selectedBillId) {
    return (
      <BillDetail 
        billId={selectedBillId} 
        onBack={() => {
          setSelectedBillId(null);
          fetchBills(); // Refresh the list to get any updates
        }}
      />
    );
  }

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
        <Button variant="outline" size="sm" onClick={fetchBills}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
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
                <TableRow 
                  key={bill.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewBill(bill.id)}
                >
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.vendorName}</TableCell>
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
        onBillCreated={handleBillCreated}
      />
    </div>
  );
}
