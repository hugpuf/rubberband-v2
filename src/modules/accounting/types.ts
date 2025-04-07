
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

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  status: 'pending' | 'completed' | 'voided';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
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
};

export type Bill = {
  id: string;
  billNumber: string;
  vendorId: string;
  issueDate: string;
  dueDate: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
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
};

export type PayrollRun = {
  id: string;
  name: string;
  period: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  employeeCount: number;
  grossAmount: number;
  netAmount: number;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contractor';
  salary: number;
  hourlyRate?: number;
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccountingModuleState = {
  isLoading: boolean;
  isError: boolean;
  config: AccountingModuleConfig | null;
  accounts: Account[];
  isInitialized: boolean;
};
