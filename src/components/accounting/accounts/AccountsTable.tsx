
import { useState } from "react";
import { Account, AccountType } from "@/modules/accounting/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Trash2 } from "lucide-react";

type AccountsTableProps = {
  accounts: Account[];
  loading: boolean;
  searchTerm: string;
  selectedType: AccountType | "all";
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export function AccountsTable({ 
  accounts, 
  loading, 
  searchTerm, 
  selectedType,
  onEdit,
  onDelete 
}: AccountsTableProps) {
  // Filter accounts based on search term and selected type
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearchTerm =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || account.type === selectedType;
    
    return matchesSearchTerm && matchesType;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </TableCell>
            </TableRow>
          ) : filteredAccounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                {searchTerm || selectedType !== "all" ? (
                  <div className="text-muted-foreground">
                    No accounts found matching your filters
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    No accounts found. Click "New Account" to create one.
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-mono">{account.code}</TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell className="capitalize">{account.type}</TableCell>
                <TableCell className="text-right">
                  ${account.balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(account)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit {account.name}</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(account)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {account.name}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
