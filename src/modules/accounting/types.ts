
// This file re-exports all types from the types subdirectory
// In the future, we should migrate fully to the types subdirectory

export type AccountingModuleConfig = {
  defaultCurrency: string;
  fiscalYearStart: string;
  taxRate: number;
  isEnabled: boolean;
};

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type TransactionLine = {
  id: string;
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  referenceNumber?: string;
  status: 'draft' | 'posted' | 'voided';
  lines: TransactionLine[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  accountId: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BillItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  accountId: string;
};

export type Bill = {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  issueDate: string;
  dueDate: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// Re-export types from the subdirectory
export {
  PayrollItem,
  PayrollRun,
  PayrollRunStatus,
  PAYROLL_RUN_STATUS,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  PayrollRunFilterParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollItemFilterParams,
  TaxCalculationResult
} from './types/payroll';

// Re-export common types
export { BaseEntity, PaginatedResponse } from './types/common';

export type AccountingModuleState = {
  isLoading: boolean;
  isError: boolean;
  config: AccountingModuleConfig | null;
  accounts: Account[];
  isInitialized: boolean;
};

// Add missing TransactionFilterParams type
export interface TransactionFilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
