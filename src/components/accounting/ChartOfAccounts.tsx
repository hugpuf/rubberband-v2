
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Account, AccountType } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logUserAction } from "@/services/userLogs";

type AccountFormValues = {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
};

export function ChartOfAccounts() {
  const { state, getAccounts, createAccount, updateAccount, deleteAccount } = useAccounting();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<AccountType | "all">("all");

  const accountTypeOptions: { value: AccountType; label: string }[] = [
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
    { value: "revenue", label: "Revenue" },
    { value: "expense", label: "Expense" },
  ];

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Unable to load accounts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Create form
  const createForm = useForm<AccountFormValues>({
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<AccountFormValues>({
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      description: "",
    },
  });

  // Set edit form values when an account is selected for editing
  useEffect(() => {
    if (editingAccount) {
      editForm.reset({
        code: editingAccount.code,
        name: editingAccount.name,
        type: editingAccount.type,
        description: editingAccount.description || "",
      });
    }
  }, [editingAccount, editForm]);

  const handleCreateSubmit = async (values: AccountFormValues) => {
    try {
      const newAccount = await createAccount({
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description,
        isActive: true,
      });
      
      setAccounts((prev) => [...prev, newAccount]);
      createForm.reset();
      setIsCreatingAccount(false);
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "create_account",
        recordId: newAccount.id,
        metadata: { account_name: newAccount.name }
      });
    } catch (err) {
      console.error("Error creating account:", err);
      // Handle the error appropriately
    }
  };

  const handleEditSubmit = async (values: AccountFormValues) => {
    if (!editingAccount) return;
    
    try {
      const updatedAccount = await updateAccount(editingAccount.id, {
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description,
      });
      
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === updatedAccount.id ? updatedAccount : account
        )
      );
      
      setEditingAccount(null);
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "update_account",
        recordId: updatedAccount.id,
        metadata: { account_name: updatedAccount.name }
      });
    } catch (err) {
      console.error("Error updating account:", err);
      // Handle the error appropriately
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (window.confirm(`Are you sure you want to archive account ${account.name}?`)) {
      try {
        await deleteAccount(account.id);
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        
        // Log user action
        await logUserAction({
          module: "accounting",
          action: "delete_account",
          recordId: account.id,
          metadata: { account_name: account.name }
        });
      } catch (err) {
        console.error("Error deleting account:", err);
        // Handle the error appropriately
      }
    }
  };

  // Filter accounts based on search term and selected type
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearchTerm =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || account.type === selectedType;
    
    return matchesSearchTerm && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Chart of Accounts</h2>
          <p className="text-muted-foreground mt-1">
            Manage your organization's financial accounts
          </p>
        </div>
        
        <Dialog open={isCreatingAccount} onOpenChange={setIsCreatingAccount}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to your chart of accounts
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1000" />
                        </FormControl>
                        <FormDescription>
                          Unique identifier for this account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypeOptions.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Cash in Bank" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Account description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreatingAccount(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Account</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AccountType | "all")}>
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
      </div>
      
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
                <TableCell colSpan={5} className="text-center py-4">
                  Loading accounts...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No accounts found
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
                      <Dialog open={editingAccount?.id === account.id} onOpenChange={(open) => !open && setEditingAccount(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingAccount(account)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Account</DialogTitle>
                            <DialogDescription>
                              Update account details
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={editForm.control}
                                  name="code"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Code</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Type</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {accountTypeOptions.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Account Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
