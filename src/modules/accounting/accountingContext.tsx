
import { createContext, useContext } from "react";
import { AccountingModuleState, AccountingModuleConfig, Account, Transaction, Invoice, Bill, PayrollRun, PayrollItem, CreatePayrollRunParams, UpdatePayrollRunParams, PayrollRunFilterParams, CreatePayrollItemParams, UpdatePayrollItemParams, PayrollItemFilterParams, PaginatedResponse } from "./types";

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
  deleteAccount: (id: string) => Promise<boolean>;
  adjustAccountBalance: (accountId: string, amount: number, description: string) => Promise<Account>;
  
  // Transaction operations
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  fetchTransactions: (filters?: { startDate?: string; endDate?: string; status?: string; search?: string; }) => Promise<Transaction[]>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  // Invoice operations
  getInvoices: () => Promise<Invoice[]>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<boolean>;
  
  // Bill operations
  getBills: () => Promise<Bill[]>;
  createBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bill>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<boolean>;
  
  // Payroll operations
  getPayrollRuns: (filters?: PayrollRunFilterParams) => Promise<PaginatedResponse<PayrollRun>>;
  getPayrollRunById: (id: string) => Promise<PayrollRun | null>;
  createPayrollRun: (params: CreatePayrollRunParams) => Promise<PayrollRun>;
  updatePayrollRun: (id: string, updates: UpdatePayrollRunParams) => Promise<PayrollRun>;
  deletePayrollRun: (id: string) => Promise<boolean>;
  processPayrollRun: (id: string) => Promise<PayrollRun>;
  finalizePayrollRun: (id: string) => Promise<PayrollRun>;
  
  getPayrollItems: (filters?: PayrollItemFilterParams) => Promise<PaginatedResponse<PayrollItem>>;
  getPayrollItemById: (id: string) => Promise<PayrollItem | null>;
  getPayrollItemsByRunId: (runId: string) => Promise<PayrollItem[]>;
  createPayrollItem: (params: CreatePayrollItemParams) => Promise<PayrollItem>;
  updatePayrollItem: (id: string, updates: UpdatePayrollItemParams) => Promise<PayrollItem>;
  deletePayrollItem: (id: string) => Promise<boolean>;
  exportPayrollRun: (id: string, format: 'csv' | 'pdf' | 'json') => Promise<string>;
  
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
