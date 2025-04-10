import { 
  Account, 
  Transaction, 
  Invoice, 
  Bill, 
  PayrollRun, 
  PayrollItem,
  AccountingModuleConfig,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  PayrollRunFilterParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollItemFilterParams,
  PaginatedResponse,
  TransactionFilterParams
} from "./types";
import { supabase } from "@/integrations/supabase/client";
import { AccountService } from "./services/AccountService";
import { TransactionService } from "./services/TransactionService";
import { InvoiceService } from "./services/InvoiceService";
import { BillService } from "./services/BillService";
import { SupabasePayrollService } from "./services/payroll/SupabasePayrollService";
import { PayrollServiceFactory } from "./services/payroll/PayrollServiceFactory";

// Initialize services
const accountService = new AccountService(supabase);
const transactionService = new TransactionService(supabase);
const invoiceService = new InvoiceService(supabase);
const billService = new BillService(supabase);
const payrollService = PayrollServiceFactory.createPayrollService(supabase) as SupabasePayrollService;

// --- Account API ---
export const getAccounts = async (): Promise<Account[]> => {
  return accountService.getAccounts();
};

export const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Account> => {
  return accountService.createAccount(account);
};

export const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account> => {
  return accountService.updateAccount(id, updates);
};

export const deleteAccount = async (id: string): Promise<boolean> => {
  return accountService.deleteAccount(id);
};

// --- Transaction API ---
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }): Promise<Transaction> => {
  return transactionService.createTransaction(transaction);
};

export const fetchTransactions = async (filters?: TransactionFilterParams): Promise<Transaction[]> => {
  return transactionService.getTransactions(filters);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  return transactionService.getTransactionById(id);
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
  return transactionService.updateTransaction(id, updates);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  return transactionService.deleteTransaction(id);
};

// --- Invoice API ---
export const getInvoices = async (options?: { filter?: string; sort?: string; page?: number; limit?: number }): Promise<Invoice[]> => {
  return invoiceService.getInvoices();
};

export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { organization_id?: string }): Promise<Invoice> => {
  // Ensure organization_id is present
  if (!invoice.organization_id) {
    throw new Error("Organization ID is required");
  }
  
  return invoiceService.createInvoice(invoice);
};

export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
  return invoiceService.updateInvoice(id, updates);
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  return invoiceService.deleteInvoice(id);
};

// For bills update and delete:
export const updateBill = async (id: string, updates: Partial<Bill>): Promise<Bill> => {
  return billService.updateBill(id, updates);
};

export const deleteBill = async (id: string): Promise<boolean> => {
  return billService.deleteBill(id);
};

// Additional API functions needed by AccountingProvider:
export const getAccountingConfig = async (organizationId: string): Promise<AccountingModuleConfig> => {
  // Mock implementation
  return Promise.resolve({
    defaultCurrency: "USD",
    fiscalYearStart: "01-01",
    taxRate: 10,
    isEnabled: true
  });
};

export const updateAccountingConfig = async (organizationId: string, config: Partial<AccountingModuleConfig>): Promise<AccountingModuleConfig> => {
  // Mock implementation
  return Promise.resolve({
    defaultCurrency: config.defaultCurrency || "USD",
    fiscalYearStart: config.fiscalYearStart || "01-01",
    taxRate: config.taxRate !== undefined ? config.taxRate : 10,
    isEnabled: config.isEnabled !== undefined ? config.isEnabled : true
  });
};

export const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }): Promise<Bill> => {
  return billService.createBill(bill);
};

export const getBills = async (): Promise<Bill[]> => {
  return billService.getBills();
};

export const adjustAccountBalance = async (accountId: string, amount: number, description: string): Promise<Account> => {
  return accountService.adjustAccountBalance(accountId, amount, description);
};

export const getPayrollRuns = async (filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> => {
  return payrollService.getPayrollRuns(filters);
};

export const getPayrollRunById = async (id: string): Promise<PayrollRun | null> => {
  return payrollService.getPayrollRunById(id);
};

export const createPayrollRun = async (params: CreatePayrollRunParams & { organization_id: string }): Promise<PayrollRun> => {
  return payrollService.createPayrollRun(params);
};

export const updatePayrollRun = async (id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> => {
  return payrollService.updatePayrollRun(id, updates);
};

export const deletePayrollRun = async (id: string): Promise<boolean> => {
  return payrollService.deletePayrollRun(id);
};

export const processPayrollRun = async (id: string): Promise<PayrollRun> => {
  return payrollService.processPayrollRun(id);
};

export const finalizePayrollRun = async (id: string): Promise<PayrollRun> => {
  return payrollService.finalizePayrollRun(id);
};

export const getPayrollItems = async (filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> => {
  return payrollService.getPayrollItems(filters);
};

export const getPayrollItemById = async (id: string): Promise<PayrollItem | null> => {
  return payrollService.getPayrollItemById(id);
};

export const getPayrollItemsByRunId = async (runId: string): Promise<PayrollItem[]> => {
  return payrollService.getPayrollItemsByRunId(runId);
};

export const createPayrollItem = async (params: CreatePayrollItemParams): Promise<PayrollItem> => {
  return payrollService.createPayrollItem(params);
};

export const updatePayrollItem = async (id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> => {
  return payrollService.updatePayrollItem(id, updates);
};

export const deletePayrollItem = async (id: string): Promise<boolean> => {
  return payrollService.deletePayrollItem(id);
};

export const exportPayrollRun = async (id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> => {
  return payrollService.exportPayrollRun(id, format);
};

export const getCustomerBalance = async (customerId: string): Promise<number> => {
  // Mock implementation
  return Promise.resolve(1500);
};

export const getVendorBalance = async (vendorId: string): Promise<number> => {
  // Mock implementation
  return Promise.resolve(2500);
};
