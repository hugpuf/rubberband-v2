
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { AccountType } from "@/modules/accounting/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountTypeOptions } from "./AccountForm";

type AccountsHeaderProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: AccountType | "all";
  onTypeChange: (value: AccountType | "all") => void;
  onRefresh: () => void;
  onNewAccount: () => void;
  loading: boolean;
};

export function AccountsHeader({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  onRefresh,
  onNewAccount,
  loading
}: AccountsHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Chart of Accounts</h2>
          <p className="text-muted-foreground mt-1">
            Manage your organization's financial accounts
          </p>
        </div>
        
        <Button className="flex items-center gap-2" onClick={onNewAccount}>
          <Plus className="h-4 w-4" />
          New Account
        </Button>
      </div>
      
      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={selectedType} onValueChange={(value) => onTypeChange(value as AccountType | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {accountTypeOptions.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    </>
  );
}
