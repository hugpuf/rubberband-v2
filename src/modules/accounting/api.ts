import { supabase } from "@/integrations/supabase/client";
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
  PaginatedResponse
} from "./types";
import { 
  mapBillFromApi, 
  mapBillToApiFormat, 
  mapInvoiceFromApi, 
  mapInvoiceToApiFormat,
  mapTransactionFromApi,
  mapTransactionToApiFormat,
  mapTransactionLineToApiFormat
} from "./utils/mappers";
import invoiceService from "./services/InvoiceService";
import transactionService from "./services/TransactionService";
import payrollService from "./services/payroll/SupabasePayrollService";

// Use Vite's import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Utility function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `API error: ${response.status}`);
    } catch (jsonError) {
      throw new Error(`API error: ${response.status} - Failed to parse error message`);
    }
  }
};

// Function to map API account data to our Account type
const mapAccountFromApi = (data: any): Account => ({
  id: data.id,
  code: data.code,
  name: data.name,
  description: data.description || '',
  type: data.type,
  balance: data.balance,
  isActive: data.is_active,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

// Function to map our Account type to API format
const mapAccountToApiFormat = (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): any => ({
  code: account.code,
  name: account.name,
  description: account.description,
  type: account.type,
  is_active: account.isActive,
});

// --- Account API ---
export const getAccounts = async (): Promise<Account[]> => {
  // For now, using mock data
  // In a real implementation, we'd fetch from the database
  return Promise.resolve([
    {
      "id": "1",
      "code": "1010",
      "name": "Cash",
      "description": "Cash on hand",
      "type": "asset",
      "balance": 1000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "2",
      "code": "1020",
      "name": "Bank Account",
      "description": "Checking account",
      "type": "asset",
      "balance": 5000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "3",
      "code": "2010",
      "name": "Accounts Payable",
      "description": "Money owed to vendors",
      "type": "liability",
      "balance": 2000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "4",
      "code": "3010",
      "name": "Retained Earnings",
      "description": "Accumulated profits",
      "type": "equity",
      "balance": 10000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "5",
      "code": "4010",
      "name": "Sales Revenue",
      "description": "Income from sales",
      "type": "revenue",
      "balance": 15000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "6",
      "code": "5010",
      "name": "Cost of Goods Sold",
      "description": "Direct costs of products sold",
      "type": "expense",
      "balance": 8000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "7",
      "code": "6010",
      "name": "Rent Expense",
      "description": "Monthly rent payments",
      "type": "expense",
      "balance": 2000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "8",
      "code": "6020",
      "name": "Utilities Expense",
      "description": "Monthly utilities payments",
      "type": "expense",
      "balance": 500,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "9",
      "code": "1110",
      "name": "Inventory",
      "description": "Goods available for sale",
      "type": "asset",
      "balance": 3000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    },
    {
      "id": "10",
      "code": "2110",
      "name": "Sales Tax Payable",
      "description": "Sales tax collected from customers",
      "type": "liability",
      "balance": 1000,
      "isActive": true,
      "createdAt": "2021-08-01T00:00:00.000Z",
      "updatedAt": "2021-08-01T00:00:00.000Z"
    }
  ]);
};

export const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Account> => {
  // Mock data
  return Promise.resolve({
    id: Math.random().toString(36).substring(7),
    code: account.code,
    name: account.name,
    description: account.description || '',
    type: account.type,
    balance: 0,
    isActive: account.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account> => {
  // Mock data
  return Promise.resolve({
    id,
    code: updates.code || '1010',
    name: updates.name || 'Cash',
    description: updates.description || 'Cash on hand',
    type: updates.type || 'asset',
    balance: 1000,
    isActive: updates.isActive !== undefined ? updates.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const deleteAccount = async (id: string): Promise<boolean> => {
  // Mock data - return true to indicate successful deletion
  return Promise.resolve(true);
};

// --- Transaction API ---
// These functions now use the TransactionService
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }): Promise<Transaction> => {
  return transactionService.createTransaction(transaction);
};

export const fetchTransactions = async (filters?: { 
  startDate?: string; 
  endDate?: string; 
  status?: string; 
  search?: string;
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<Transaction[]> => {
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
  return invoiceService.getInvoices(options);
};

export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { organization_id?: string }): Promise<Invoice> => {
  // Ensure organization_id is present
  if (!invoice.organization_id) {
    throw new Error("Organization ID is required");
  }
  
  return invoiceService.createInvoice(invoice as any);
};

export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
  return invoiceService.updateInvoice(id, updates);
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  return invoiceService.deleteInvoice(id);
};

// For bills update and delete:
export const updateBill = async (id: string, updates: Partial<Bill>): Promise<Bill> => {
  try {
    // Convert updates to database format
    const updateData: any = {};
    if (updates.vendorName !== undefined) updateData.vendor_name = updates.vendorName;
    if (updates.vendorId !== undefined) updateData.vendor_id = updates.vendorId;
    if (updates.billNumber !== undefined) updateData.bill_number = updates.billNumber;
    if (updates.issueDate !== undefined) updateData.issue_date = updates.issueDate;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
    if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
    if (updates.total !== undefined) updateData.total = updates.total;
    
    updateData.updated_at = new Date().toISOString();

    // Update the bill
    const { data: updatedBill, error } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // If there are items to update
    if (updates.items && updates.items.length > 0) {
      // First, delete existing items
      const { error: deleteError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', id);

      if (deleteError) throw deleteError;

      // Then insert new items
      const billItems = updates.items.map(item => ({
        bill_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        amount: item.amount,
        account_id: item.accountId
      }));

      const { error: insertError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (insertError) throw insertError;
    }

    // Fetch the updated bill with its items
    const { data: billWithItems, error: fetchError } = await supabase
      .from('bills')
      .select(`
        *,
        items:bill_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return mapBillFromApi(billWithItems);
  } catch (error) {
    console.error(`Error updating bill ${id}:`, error);
    throw error;
  }
};

export const deleteBill = async (id: string): Promise<boolean> => {
  try {
    // Delete bill items first (should cascade, but just to be safe)
    const { error: itemsError } = await supabase
      .from('bill_items')
      .delete()
      .eq('bill_id', id);

    if (itemsError) throw itemsError;

    // Delete the bill
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting bill ${id}:`, error);
    throw error;
  }
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
  try {
    // Map bill to database format
    const billData = {
      ...mapBillToApiFormat(bill),
      organization_id: bill.organization_id,
      // If billNumber is provided, use it; otherwise, it will be generated by the trigger
      bill_number: bill.billNumber || null,
      contact_type: 'vendor' // Add contact_type explicitly
    };

    console.log('Creating bill with data:', billData);
    console.log('Bill data fields:', Object.keys(billData));
    console.log('Bill data types:', Object.entries(billData).map(([key, value]) => `${key}: ${typeof value}`));
    
    // Check for null values in required fields
    const requiredFields = ['organization_id', 'contact_type', 'status', 'issue_date', 'due_date'];
    const missingFields = requiredFields.filter(field => billData[field] === null || billData[field] === undefined);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
    }

    // Insert bill
    const { data: insertedBill, error } = await supabase
      .from('bills')
      .insert(billData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting bill:', error);
      console.error('Error details:', error.details, error.hint, error.message);
      throw error;
    }
    
    // Insert bill items
    if (bill.items && bill.items.length > 0) {
      const billItems = bill.items.map(item => ({
        bill_id: insertedBill.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        amount: item.amount,
        account_id: item.accountId
      }));

      console.log('Bill items data:', billItems);

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (itemsError) {
        console.error('Error inserting bill items:', itemsError);
        console.error('Error details:', itemsError.details, itemsError.hint, itemsError.message);
        throw itemsError;
      }
    }

    // Fetch the inserted bill with its items
    const { data: billWithItems, error: fetchError } = await supabase
      .from('bills')
      .select(`
        *,
        items:bill_items(*)
      `)
      .eq('id', insertedBill.id)
      .single();

    if (fetchError) {
      console.error('Error fetching bill with items:', fetchError);
      throw fetchError;
    }

    return mapBillFromApi(billWithItems);
  } catch (error) {
    console.error(`Error creating bill:`, error);
    throw error;
  }
};

// Implement missing API functions required by AccountingContext
export const getBills = async (): Promise<Bill[]> => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        items:bill_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(mapBillFromApi);
  } catch (error) {
    console.error('Error fetching bills:', error);
    // Return empty array as fallback
    return [];
  }
};

export const adjustAccountBalance = async (accountId: string, amount: number, description: string): Promise<Account> => {
  // Mock implementation
  return Promise.resolve({
    id: accountId,
    code: '1010',
    name: 'Cash',
    description: 'Cash on hand',
    type: 'asset',
    balance: 1000 + amount, // Simulate balance adjustment
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
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
