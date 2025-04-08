
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Transaction, Account } from "@/modules/accounting/types";
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
import { NewTransactionDialog } from "./NewTransactionDialog";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import { TransactionDetail } from "./TransactionDetail";
import { Card } from "@/components/ui/card";

export function TransactionJournal() {
  const { fetchTransactions } = useAccounting();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Added this function definition to match its usage
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // We need to implement fetchTransactions in the context
      const fetchedTransactions = await useAccounting().fetchTransactions();
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Failed to load transactions",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionCreated = (newTransaction: Transaction) => {
    setTransactions((current) => [newTransaction, ...current]);
  };

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeFilter && transaction.status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(query) ||
        (transaction.referenceNumber && transaction.referenceNumber.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const statusCounts = transactions.reduce(
    (acc, transaction) => {
      acc[transaction.status] = (acc[transaction.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // If a transaction is selected, show its detail view
  if (selectedTransactionId) {
    return (
      <TransactionDetail 
        transactionId={selectedTransactionId} 
        onBack={() => {
          setSelectedTransactionId(null);
          fetchTransactions(); // Refresh the list to get any updates
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">Transaction Journal</h2>
          <p className="text-muted-foreground">
            Record and track financial transactions
          </p>
        </div>
        <Button onClick={() => setShowNewTransactionDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Transaction
        </Button>
      </div>

      <div className="flex space-x-2 pb-2 border-b">
        <Button
          variant={activeFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter(null)}
        >
          All ({transactions.length})
        </Button>
        <Button
          variant={activeFilter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("draft")}
        >
          Draft ({statusCounts["draft"] || 0})
        </Button>
        <Button
          variant={activeFilter === "posted" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("posted")}
        >
          Posted ({statusCounts["posted"] || 0})
        </Button>
        <Button
          variant={activeFilter === "voided" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("voided")}
        >
          Voided ({statusCounts["voided"] || 0})
        </Button>
      </div>

      <div className="flex justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchTransactions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p>Loading transactions...</p>
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <div className="h-64 flex items-center justify-center flex-col bg-white rounded-lg border p-6">
          <p className="text-muted-foreground mb-4">No transactions found</p>
          <Button onClick={() => setShowNewTransactionDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Transaction
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => {
                // Calculate totals for this transaction
                const totalDebit = transaction.lines.reduce((sum, line) => sum + line.debitAmount, 0);
                const totalCredit = transaction.lines.reduce((sum, line) => sum + line.creditAmount, 0);
                
                return (
                  <TableRow 
                    key={transaction.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewTransaction(transaction.id)}
                  >
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.referenceNumber || "-"}</TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-right">${totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${totalCredit.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
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

      <NewTransactionDialog
        open={showNewTransactionDialog}
        onOpenChange={setShowNewTransactionDialog}
        onTransactionCreated={handleTransactionCreated}
      />
    </div>
  );
}
