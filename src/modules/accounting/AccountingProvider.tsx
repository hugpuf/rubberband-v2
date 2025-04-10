
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  FC,
} from "react";
import { useSessionContext } from "@supabase/auth-helpers-react";
import {
  AccountingModuleConfig,
  Account,
  AccountType,
  Transaction,
  TransactionLine,
  Invoice,
  InvoiceItem,
  Bill,
  BillItem,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  PayrollRunFilterParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollItemFilterParams,
  PaginatedResponse,
  PayrollRun,
  PayrollItem,
  TransactionFilterParams,
} from "./types";
import { Database } from "@/integrations/supabase/types";
import { AccountService } from "./services/AccountService";
import { TransactionService } from "./services/TransactionService";
import { InvoiceService } from "./services/InvoiceService";
import { BillService } from "./services/BillService";
import { SupabasePayrollService } from "./services/payroll/SupabasePayrollService";
import { PayrollServiceFactory } from "./services/payroll/PayrollServiceFactory";
import { supabase } from "@/integrations/supabase/client";

type AccountingContextType = {
  isLoading: boolean;
  isError: boolean;
  config: AccountingModuleConfig | null;
  accounts: Account[];
  transactions: Transaction[];
  invoices: Invoice[];
  bills: Bill[];
  isInitialized: boolean;
  createAccount: (account: Omit<Account, "id">) => Promise<Account>;
  getAccounts: () => Promise<Account[]>;
  getAccountById: (id: string) => Promise<Account | null>;
  getAccountsByType: (type: AccountType) => Promise<Account[]>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;
  createTransaction: (transaction: Omit<Transaction, "id"> & { organization_id: string }) => Promise<Transaction>;
  getTransactions: () => Promise<Transaction[]>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  createInvoice: (invoice: Omit<Invoice, "id"> & { organization_id: string }) => Promise<Invoice>;
  getInvoices: () => Promise<Invoice[]>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<boolean>;
  createBill: (bill: Omit<Bill, "id"> & { organization_id: string }) => Promise<Bill>;
  getBills: () => Promise<Bill[]>;
  getBillById: (id: string) => Promise<Bill | null>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<boolean>;
  adjustAccountBalance: (accountId: string, amount: number, description: string) => Promise<Account>;
  getCustomerBalance: (customerId: string) => Promise<number>;
  getVendorBalance: (vendorId: string) => Promise<number>;
  createPayrollRun: (params: CreatePayrollRunParams & { organization_id: string }) => Promise<PayrollRun>;
  getPayrollRuns: (filters?: PayrollRunFilterParams) => Promise<PaginatedResponse<PayrollRun>>;
  getPayrollRunsByPage: (page: number, limit: number, filters?: Omit<PayrollRunFilterParams, 'page' | 'limit'>) => Promise<PaginatedResponse<PayrollRun>>;
  getPayrollRunById: (id: string) => Promise<PayrollRun | null>;
  updatePayrollRun: (id: string, updates: UpdatePayrollRunParams) => Promise<PayrollRun>;
  deletePayrollRun: (id: string) => Promise<boolean>;
  processPayrollRun: (id: string) => Promise<PayrollRun>;
  finalizePayrollRun: (id: string) => Promise<PayrollRun>;
  createPayrollItem: (params: CreatePayrollItemParams) => Promise<PayrollItem>;
  getPayrollItems: (filters?: PayrollItemFilterParams) => Promise<PaginatedResponse<PayrollItem>>;
  getPayrollItemById: (id: string) => Promise<PayrollItem | null>;
  getPayrollItemsByRunId: (runId: string) => Promise<PayrollItem[]>;
  updatePayrollItem: (id: string, updates: UpdatePayrollItemParams) => Promise<PayrollItem>;
  deletePayrollItem: (id: string) => Promise<boolean>;
};

const AccountingContext = createContext<AccountingContextType | undefined>(
  undefined
);

interface AccountingProviderProps {
  children: ReactNode;
}

export const AccountingProvider: FC<AccountingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [config, setConfig] = useState<AccountingModuleConfig | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { supabaseClient } = useSessionContext();
  const [accountService, setAccountService] = useState<AccountService | null>(null);
  const [transactionService, setTransactionService] = useState<TransactionService | null>(null);
  const [invoiceService, setInvoiceService] = useState<InvoiceService | null>(null);
  const [billService, setBillService] = useState<BillService | null>(null);
  const [payrollService, setPayrollService] = useState<SupabasePayrollService | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      setIsLoading(true);
      try {
        const client = supabaseClient || supabase;
        setAccountService(new AccountService(client));
        setTransactionService(new TransactionService(client));
        setInvoiceService(new InvoiceService(client));
        setBillService(new BillService(client));
        setPayrollService(PayrollServiceFactory.createPayrollService(client) as SupabasePayrollService);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing accounting services:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, [supabaseClient]);

  const createAccount = async (account: Omit<Account, "id">): Promise<Account> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    const newAccount = await accountService.createAccount(account);
    setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
    return newAccount;
  };

  const getAccounts = async (): Promise<Account[]> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    const fetchedAccounts = await accountService.getAccounts();
    setAccounts(fetchedAccounts);
    return fetchedAccounts;
  };

  const getAccountById = async (id: string): Promise<Account | null> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    return accountService.getAccountById(id);
  };

  const getAccountsByType = async (type: AccountType): Promise<Account[]> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    return accountService.getAccountsByType(type);
  };

  const updateAccount = async (
    id: string,
    updates: Partial<Account>
  ): Promise<Account> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    const updatedAccount = await accountService.updateAccount(id, updates);
    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => (account.id === id ? updatedAccount : account))
    );
    return updatedAccount;
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    const success = await accountService.deleteAccount(id);
    if (success) {
      setAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account.id !== id)
      );
    }
    return success;
  };

  const createTransaction = async (
    transaction: Omit<Transaction, "id"> & { organization_id: string }
  ): Promise<Transaction> => {
    if (!transactionService) {
      throw new Error("Transaction service not initialized");
    }
    const newTransaction = await transactionService.createTransaction(transaction);
    setTransactions((prevTransactions) => [...prevTransactions, newTransaction]);
    return newTransaction;
  };

  const getTransactions = async (): Promise<Transaction[]> => {
    if (!transactionService) {
      throw new Error("Transaction service not initialized");
    }
    const fetchedTransactions = await transactionService.getTransactions();
    setTransactions(fetchedTransactions);
    return fetchedTransactions;
  };

  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    if (!transactionService) {
      throw new Error("Transaction service not initialized");
    }
    return transactionService.getTransactionById(id);
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> => {
    if (!transactionService) {
      throw new Error("Transaction service not initialized");
    }
    const updatedTransaction = await transactionService.updateTransaction(id, updates) as Transaction;
    setTransactions((prevTransactions) =>
      prevTransactions.map((transaction) =>
        transaction.id === id ? updatedTransaction : transaction
      )
    );
    return updatedTransaction;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!transactionService) {
      throw new Error("Transaction service not initialized");
    }
    const success = await transactionService.deleteTransaction(id);
    if (success) {
      setTransactions((prevTransactions) =>
        prevTransactions.filter((transaction) => transaction.id !== id)
      );
    }
    return success;
  };

  const createInvoice = async (
    invoice: Omit<Invoice, "id"> & { organization_id: string }
  ): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error("Invoice service not initialized");
    }
    const newInvoice = await invoiceService.createInvoice(invoice);
    setInvoices((prevInvoices) => [...prevInvoices, newInvoice]);
    return newInvoice;
  };

  const getInvoices = async (): Promise<Invoice[]> => {
    if (!invoiceService) {
      throw new Error("Invoice service not initialized");
    }
    const fetchedInvoices = await invoiceService.getInvoices();
    setInvoices(fetchedInvoices);
    return fetchedInvoices;
  };

  const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    if (!invoiceService) {
      throw new Error("Invoice service not initialized");
    }
    return invoiceService.getInvoiceById(id);
  };

  const updateInvoice = async (
    id: string,
    updates: Partial<Invoice>
  ): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error("Invoice service not initialized");
    }
    const updatedInvoice = await invoiceService.updateInvoice(id, updates);
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) => (invoice.id === id ? updatedInvoice : invoice))
    );
    return updatedInvoice;
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    if (!invoiceService) {
      throw new Error("Invoice service not initialized");
    }
    const success = await invoiceService.deleteInvoice(id);
    if (success) {
      setInvoices((prevInvoices) =>
        prevInvoices.filter((invoice) => invoice.id !== id)
      );
    }
    return success;
  };

  const createBill = async (bill: Omit<Bill, "id"> & { organization_id: string }): Promise<Bill> => {
    if (!billService) {
      throw new Error("Bill service not initialized");
    }
    const newBill = await billService.createBill(bill);
    setBills((prevBills) => [...prevBills, newBill]);
    return newBill;
  };

  const getBills = async (): Promise<Bill[]> => {
    if (!billService) {
      throw new Error("Bill service not initialized");
    }
    const fetchedBills = await billService.getBills();
    setBills(fetchedBills);
    return fetchedBills;
  };

  const getBillById = async (id: string): Promise<Bill | null> => {
    if (!billService) {
      throw new Error("Bill service not initialized");
    }
    return billService.getBillById(id);
  };

  const updateBill = async (
    id: string,
    updates: Partial<Bill>
  ): Promise<Bill> => {
    if (!billService) {
      throw new Error("Bill service not initialized");
    }
    const updatedBill = await billService.updateBill(id, updates);
    setBills((prevBills) =>
      prevBills.map((bill) => (bill.id === id ? updatedBill : bill))
    );
    return updatedBill;
  };

  const deleteBill = async (id: string): Promise<boolean> => {
    if (!billService) {
      throw new Error("Bill service not initialized");
    }
    const success = await billService.deleteBill(id);
    if (success) {
      setBills((prevBills) => prevBills.filter((bill) => bill.id !== id));
    }
    return success;
  };

  // Add implementations for the missing accounting operations
  const adjustAccountBalance = async (accountId: string, amount: number, description: string): Promise<Account> => {
    if (!accountService) {
      throw new Error("Account service not initialized");
    }
    return accountService.adjustAccountBalance(accountId, amount, description);
  };

  const getCustomerBalance = async (customerId: string): Promise<number> => {
    // Simple implementation for now
    return Promise.resolve(0);
  };

  const getVendorBalance = async (vendorId: string): Promise<number> => {
    // Simple implementation for now
    return Promise.resolve(0);
  };

  // Update PaginatedResponse return values to not include hasMore
  const getPayrollRuns = async (filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> => {
    try {
      if (!payrollService) {
        throw new Error("Payroll service not initialized");
      }
      
      const result = await payrollService.getPayrollRuns(filters);
      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error: any) {
      console.error("Error fetching payroll runs:", error);
      throw error;
    }
  };

  const getPayrollRunsByPage = async (page: number, limit: number, filters?: Omit<PayrollRunFilterParams, 'page' | 'limit'>): Promise<PaginatedResponse<PayrollRun>> => {
    try {
      if (!payrollService) {
        throw new Error("Payroll service not initialized");
      }
      
      const result = await payrollService.getPayrollRuns({
        ...filters,
        page,
        limit
      });
      
      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error: any) {
      console.error("Error fetching payroll runs:", error);
      throw error;
    }
  };

  // Update the getPayrollItems function to not include hasMore
  const getPayrollItems = async (filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> => {
    try {
      if (!payrollService) {
        throw new Error("Payroll service not initialized");
      }
      
      const result = await payrollService.getPayrollItems(filters);
      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error: any) {
      console.error("Error fetching payroll items:", error);
      throw error;
    }
  };

  const createPayrollRun = async (params: CreatePayrollRunParams & { organization_id: string }): Promise<PayrollRun> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    
    const newPayrollRun = await payrollService.createPayrollRun(params);
    return newPayrollRun;
  };

  const getPayrollRunById = async (id: string): Promise<PayrollRun | null> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.getPayrollRunById(id);
  };

  const updatePayrollRun = async (
    id: string,
    updates: UpdatePayrollRunParams
  ): Promise<PayrollRun> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.updatePayrollRun(id, updates);
  };

  const deletePayrollRun = async (id: string): Promise<boolean> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.deletePayrollRun(id);
  };

  const processPayrollRun = async (id: string): Promise<PayrollRun> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.processPayrollRun(id);
  };

  const finalizePayrollRun = async (id: string): Promise<PayrollRun> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.finalizePayrollRun(id);
  };

  const createPayrollItem = async (params: CreatePayrollItemParams): Promise<PayrollItem> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.createPayrollItem(params);
  };

  const getPayrollItemById = async (id: string): Promise<PayrollItem | null> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.getPayrollItemById(id);
  };

  const getPayrollItemsByRunId = async (runId: string): Promise<PayrollItem[]> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.getPayrollItemsByRunId(runId);
  };

  const updatePayrollItem = async (
    id: string,
    updates: UpdatePayrollItemParams
  ): Promise<PayrollItem> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.updatePayrollItem(id, updates);
  };

  const deletePayrollItem = async (id: string): Promise<boolean> => {
    if (!payrollService) {
      throw new Error("Payroll service not initialized");
    }
    return payrollService.deletePayrollItem(id);
  };

  const value = {
    isLoading,
    isError,
    config,
    accounts,
    transactions,
    invoices,
    bills,
    isInitialized,
    createAccount,
    getAccounts,
    getAccountById,
    getAccountsByType,
    updateAccount,
    deleteAccount,
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    createBill,
    getBills,
    getBillById,
    updateBill,
    deleteBill,
    adjustAccountBalance,
    getCustomerBalance,
    getVendorBalance,
    createPayrollRun,
    getPayrollRuns,
    getPayrollRunsByPage,
    getPayrollRunById,
    updatePayrollRun,
    deletePayrollRun,
    processPayrollRun,
    finalizePayrollRun,
    createPayrollItem,
    getPayrollItems,
    getPayrollItemById,
    getPayrollItemsByRunId,
    updatePayrollItem,
    deletePayrollItem,
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (context === undefined) {
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  return context;
};
