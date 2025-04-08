
import { createContext, useContext } from "react";
import { AccountingModuleState, AccountingModuleConfig, Account, Transaction, Invoice, Bill, PayrollRun } from "./types";

export type AccountingContextType = {
  // State
  state: AccountingModuleState;
  
  // Configuration functions
  initializeModule: () => Promise<void>;
  updateModuleConfig: (config: Partial<AccountingModuleConfig>) => Promise<void>;
  
  // Account operations
  getAccounts: () => Promise<Account[]>;
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  adjustAccountBalance: (accountId: string, amount: number, description: string) => Promise<Account>;
  
  // Transaction operations
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  
  // Invoice operations
  getInvoices: () => Promise<Invoice[]>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Bill operations
  getBills: () => Promise<Bill[]>;
  createBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bill>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<Bill>;
  
  // Payroll operations
  getPayrollRuns: () => Promise<PayrollRun[]>;
  
  // Cross-module integration
  getCustomerBalance: (customerId: string) => Promise<number>;
  getVendorBalance: (vendorId: string) => Promise<number>;
};

export const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (context === undefined) {
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  return context;
};
