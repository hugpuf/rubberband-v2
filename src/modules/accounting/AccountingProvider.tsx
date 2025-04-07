
import { ReactNode, useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { AccountingContext } from "./accountingContext";
import { 
  AccountingModuleState, 
  AccountingModuleConfig, 
  Account, 
  Transaction, 
  Invoice, 
  Bill,
  InvoiceItem,
  BillItem
} from "./types";
import * as accountingApi from "./api";

const initialState: AccountingModuleState = {
  isLoading: true,
  isError: false,
  config: null,
  accounts: [],
  isInitialized: false
};

export function AccountingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountingModuleState>(initialState);
  const { organization } = useOrganization();
  const { toast } = useToast();

  // Initialize the module when the organization is loaded
  useEffect(() => {
    if (organization?.id && !state.isInitialized) {
      initializeModule();
    }
  }, [organization?.id]);

  const initializeModule = async () => {
    if (!organization?.id) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Fetch accounting configuration
      const config = await accountingApi.getAccountingConfig(organization.id);
      
      // Fetch accounts
      const accounts = await accountingApi.fetchAccounts(organization.id);
      
      setState({
        isLoading: false,
        isError: false,
        config,
        accounts,
        isInitialized: true
      });
    } catch (error) {
      console.error("Error initializing accounting module:", error);
      setState(prev => ({ 
        ...prev,
        isLoading: false,
        isError: true 
      }));
      
      toast({
        variant: "destructive",
        title: "Error loading accounting module",
        description: "There was a problem loading the accounting module. Please try again later."
      });
    }
  };

  const updateModuleConfig = async (configUpdates: Partial<AccountingModuleConfig>) => {
    if (!organization?.id) return;
    
    try {
      await accountingApi.updateAccountingConfig(organization.id, configUpdates);
      
      // Update local state
      setState(prev => ({
        ...prev,
        config: prev.config ? { ...prev.config, ...configUpdates } : null
      }));
      
      toast({
        title: "Configuration updated",
        description: "Accounting module configuration has been updated."
      });
    } catch (error) {
      console.error("Error updating module config:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update accounting configuration."
      });
    }
  };

  // Account operations - placeholders for Phase 4 implementation
  const getAccounts = async () => {
    if (!organization?.id) return [];
    return state.accounts;
  };
  
  const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => {
    // Placeholder - will be implemented in Phase 4
    const newAccount: Account = {
      ...account,
      id: `temp-${Date.now()}`,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newAccount;
  };
  
  const updateAccount = async (id: string, updates: Partial<Account>) => {
    // Placeholder - will be implemented in Phase 4
    const updatedAccount = state.accounts.find(a => a.id === id);
    if (!updatedAccount) throw new Error("Account not found");
    
    return {
      ...updatedAccount,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  };
  
  const deleteAccount = async (id: string) => {
    // Placeholder - will be implemented in Phase 4
  };
  
  // Transaction operations - placeholders for Phase 4 implementation
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Placeholder - will be implemented in Phase 4
    const newTransaction: Transaction = {
      ...transaction,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newTransaction;
  };
  
  // Invoice operations - placeholders for Phase 4 implementation
  const getInvoices = async () => {
    // Placeholder - will be implemented in Phase 4
    return [] as Invoice[];
  };
  
  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Placeholder - will be implemented in Phase 4
    const newInvoice: Invoice = {
      ...invoice,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newInvoice;
  };
  
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    // Placeholder - will be implemented in Phase 4
    // Fix: Explicitly cast the status to the correct type
    const updatedInvoice: Invoice = {
      id,
      invoiceNumber: '',
      customerId: '',
      issueDate: '',
      dueDate: '',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'draft', // Explicitly use a valid status value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };
    
    return updatedInvoice;
  };
  
  // Bill operations - placeholders for Phase 4 implementation
  const getBills = async () => {
    // Placeholder - will be implemented in Phase 4
    return [] as Bill[];
  };
  
  const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Placeholder - will be implemented in Phase 4
    const newBill: Bill = {
      ...bill,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newBill;
  };
  
  const updateBill = async (id: string, updates: Partial<Bill>) => {
    // Placeholder - will be implemented in Phase 4
    const updatedBill: Bill = {
      id,
      billNumber: '',
      vendorId: '',
      issueDate: '',
      dueDate: '',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'draft', // Explicitly use a valid status value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };
    
    return updatedBill;
  };
  
  // Cross-module integration
  const getCustomerBalance = async (customerId: string) => {
    return accountingApi.getCustomerBalance(customerId);
  };
  
  const getVendorBalance = async (vendorId: string) => {
    return accountingApi.getVendorBalance(vendorId);
  };

  const contextValue = {
    state,
    initializeModule,
    updateModuleConfig,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    getInvoices,
    createInvoice,
    updateInvoice,
    getBills,
    createBill,
    updateBill,
    getCustomerBalance,
    getVendorBalance
  };

  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
