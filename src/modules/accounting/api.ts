import { Account, Transaction, Invoice, Bill, BillItem, PayrollRun } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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
  currency: data.currency,
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
  currency: account.currency,
  is_active: account.isActive,
});

// Function to map API transaction data to our Transaction type
const mapTransactionFromApi = (data: any): Transaction => ({
  id: data.id,
  date: data.date,
  description: data.description,
  referenceNumber: data.reference_number || null,
  status: data.status,
  lines: data.lines.map((line: any) => ({
    id: line.id,
    accountId: line.account_id,
    description: line.description || null,
    debitAmount: line.debit_amount,
    creditAmount: line.credit_amount,
    createdAt: line.created_at,
    updatedAt: line.updated_at,
  })),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

// Function to map our Transaction type to API format
const mapTransactionToApiFormat = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): any => ({
  date: transaction.date,
  description: transaction.description,
  reference_number: transaction.referenceNumber,
  status: transaction.status,
  lines: transaction.lines.map(line => ({
    account_id: line.accountId,
    description: line.description,
    debit_amount: line.debitAmount,
    credit_amount: line.creditAmount,
  })),
});

const mapInvoiceItemFromApi = (data: any): any => ({
  id: data.id,
  name: data.name,
  description: data.description,
  quantity: data.quantity,
  unitPrice: data.unit_price,
  total: data.total,
  accountId: data.account_id,
});

const mapInvoiceFromApi = (data: any): Invoice => {
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    customerName: data.customer_id ? data.customer_name || "Unknown Customer" : "Unknown Customer",
    notes: data.notes,
    status: data.status,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    total: data.total,
    items: data.items ? data.items.map(mapInvoiceItemFromApi) : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

const mapBillItemFromApi = (data: any): BillItem => ({
  id: data.id,
  name: data.name,
  description: data.description,
  quantity: data.quantity,
  unitPrice: data.unit_price,
  total: data.total,
  accountId: data.account_id,
});

// Map API bill data to our Bill type
const mapBillFromApi = (data: any): Bill => {
  return {
    id: data.id,
    billNumber: data.bill_number,
    vendorName: data.contact_id ? data.vendor_name || "Unknown Vendor" : "Unknown Vendor",
    notes: data.notes,
    status: data.status,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    total: data.total,
    items: data.items ? data.items.map(mapBillItemFromApi) : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// --- Account API ---
export const getAccounts = async (): Promise<Account[]> => {
  // Mock data
  return Promise.resolve([
    {
      "id": "1",
      "code": "1010",
      "name": "Cash",
      "description": "Cash on hand",
      "type": "asset",
      "balance": 1000,
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
      "currency": "USD",
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
    currency: account.currency,
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
    currency: updates.currency || 'USD',
    isActive: updates.isActive !== undefined ? updates.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const deleteAccount = async (id: string): Promise<void> => {
  // Mock data
  return Promise.resolve();
};

// --- Transaction API ---
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
  // Mock data
  return Promise.resolve({
    id: Math.random().toString(36).substring(7),
    date: transaction.date,
    description: transaction.description,
    referenceNumber: transaction.referenceNumber || null,
    status: transaction.status,
    lines: transaction.lines.map(line => ({
      id: Math.random().toString(36).substring(7),
      accountId: line.accountId,
      description: line.description || null,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const fetchTransactions = async (filters?: { startDate?: string; endDate?: string; status?: string; search?: string; }): Promise<Transaction[]> => {
  // Mock data
  return Promise.resolve([
    {
      "id": "1",
      "date": "2024-01-20",
      "description": "Payment to vendor A",
      "referenceNumber": "REF-2024-001",
      "status": "posted",
      "lines": [
        {
          "id": "1",
          "accountId": "1",
          "description": "Payment for invoice INV-2023-12",
          "debitAmount": 500,
          "creditAmount": 0,
          "createdAt": "2024-01-20T00:00:00.000Z",
          "updatedAt": "2024-01-20T00:00:00.000Z"
        },
        {
          "id": "2",
          "accountId": "2",
          "description": "Cash withdrawal",
          "debitAmount": 0,
          "creditAmount": 500,
          "createdAt": "2024-01-20T00:00:00.000Z",
          "updatedAt": "2024-01-20T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-20T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    },
    {
      "id": "2",
      "date": "2024-01-15",
      "description": "Sales revenue from customer B",
      "referenceNumber": "REF-2024-002",
      "status": "posted",
      "lines": [
        {
          "id": "3",
          "accountId": "3",
          "description": "Revenue from product X",
          "debitAmount": 0,
          "creditAmount": 1000,
          "createdAt": "2024-01-15T00:00:00.000Z",
          "updatedAt": "2024-01-15T00:00:00.000Z"
        },
        {
          "id": "4",
          "accountId": "4",
          "description": "Cash deposit",
          "debitAmount": 1000,
          "creditAmount": 0,
          "createdAt": "2024-01-15T00:00:00.000Z",
          "updatedAt": "2024-01-15T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "3",
      "date": "2024-01-10",
      "description": "Purchase of office supplies",
      "referenceNumber": "REF-2024-003",
      "status": "draft",
      "lines": [
        {
          "id": "5",
          "accountId": "5",
          "description": "Supplies from vendor C",
          "debitAmount": 200,
          "creditAmount": 0,
          "createdAt": "2024-01-10T00:00:00.000Z",
          "updatedAt": "2024-01-10T00:00:00.000Z"
        },
        {
          "id": "6",
          "accountId": "6",
          "description": "Payment for supplies",
          "debitAmount": 0,
          "creditAmount": 200,
          "createdAt": "2024-01-10T00:00:00.000Z",
          "updatedAt": "2024-01-10T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z"
    },
    {
      "id": "4",
      "date": "2024-01-05",
      "description": "Payment of rent for January",
      "referenceNumber": "REF-2024-004",
      "status": "posted",
      "lines": [
        {
          "id": "7",
          "accountId": "7",
          "description": "Rent expense for January",
          "debitAmount": 1500,
          "creditAmount": 0,
          "createdAt": "2024-01-05T00:00:00.000Z",
          "updatedAt": "2024-01-05T00:00:00.000Z"
        },
        {
          "id": "8",
          "accountId": "8",
          "description": "Cash payment for rent",
          "debitAmount": 0,
          "creditAmount": 1500,
          "createdAt": "2024-01-05T00:00:00.000Z",
          "updatedAt": "2024-01-05T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-05T00:00:00.000Z",
      "updatedAt": "2024-01-05T00:00:00.000Z"
    },
    {
      "id": "5",
      "date": "2023-12-31",
      "description": "Year-end depreciation expense",
      "referenceNumber": "REF-2023-005",
      "status": "posted",
      "lines": [
        {
          "id": "9",
          "accountId": "9",
          "description": "Depreciation expense",
          "debitAmount": 800,
          "creditAmount": 0,
          "createdAt": "2023-12-31T00:00:00.000Z",
          "updatedAt": "2023-12-31T00:00:00.000Z"
        },
        {
          "id": "10",
          "accountId": "10",
          "description": "Accumulated depreciation",
          "debitAmount": 0,
          "creditAmount": 800,
          "createdAt": "2023-12-31T00:00:00.000Z",
          "updatedAt": "2023-12-31T00:00:00.000Z"
        }
      ],
      "createdAt": "2023-12-31T00:00:00.000Z",
      "updatedAt": "2023-12-31T00:00:00.000Z"
    }
  ]);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  // Mock data
  const transactions = await fetchTransactions();
  return Promise.resolve(transactions.find(transaction => transaction.id === id) || null);
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
  // Mock data
  const transactions = await fetchTransactions();
  const transaction = transactions.find(transaction => transaction.id === id);
  if (transaction) {
    return Promise.resolve({
      ...transaction,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
  return Promise.resolve(null);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  // Mock data
  return Promise.resolve(true);
};

// --- Invoice API ---
export const getInvoices = async (): Promise<Invoice[]> => {
  // Mock data
  return Promise.resolve([
    {
      "id": "1",
      "invoiceNumber": "INV-2024-001",
      "customerName": "Customer A",
      "notes": "Invoice for services rendered in January",
      "status": "posted",
      "issueDate": "2024-01-01",
      "dueDate": "2024-01-31",
      "subtotal": 5000,
      "taxAmount": 500,
      "total": 5500,
      "items": [
        {
          "id": "1",
          "name": "Service 1",
          "description": "Consulting services",
          "quantity": 10,
          "unitPrice": 500,
          "total": 5000,
          "accountId": "1"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "2",
      "invoiceNumber": "INV-2024-002",
      "customerName": "Customer B",
      "notes": "Invoice for product sales in January",
      "status": "draft",
      "issueDate": "2024-01-15",
      "dueDate": "2024-02-15",
      "subtotal": 2000,
      "taxAmount": 200,
      "total": 2200,
      "items": [
        {
          "id": "2",
          "name": "Product X",
          "description": "Sales of product X",
          "quantity": 20,
          "unitPrice": 100,
          "total": 2000,
          "accountId": "2"
        }
      ],
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "3",
      "invoiceNumber": "INV-2024-003",
      "customerName": "Customer C",
      "notes": "Invoice for maintenance services in January",
      "status": "posted",
      "issueDate": "2024-01-20",
      "dueDate": "2024-02-20",
      "subtotal": 3000,
      "taxAmount": 300,
      "total": 3300,
      "items": [
        {
          "id": "3",
          "name": "Maintenance Service",
          "description": "Regular maintenance services",
          "quantity": 1,
          "unitPrice": 3000,
          "total": 3000,
          "accountId": "3"
        }
      ],
      "createdAt": "2024-01-20T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    }
  ]);
};

export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  // Mock data
  return Promise.resolve({
    id: Math.random().toString(36).substring(7),
    invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
    customerName: invoice.customerName,
    notes: invoice.notes,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    items: invoice.items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

// For bills update and delete:
export const updateBill = async (id: string, updates: Partial<Bill>): Promise<Bill> => {
  try {
    // Simulation of API call to update a bill
    console.log(`Updating bill ${id} with`, updates);
    
    // In a real implementation, we would use Supabase or another API
    // Example of a Supabase implementation:
    // const { data, error } = await supabase
    //   .from('bills')
    //   .update(mapBillToApiFormat(updates))
    //   .eq('id', id)
    //   .select()
    //   .single();
    
    // For now, simulate a successful response
    return {
      id,
      ...updates,
      billNumber: updates.billNumber || `BILL-${Math.floor(Math.random() * 10000)}`,
      vendorName: updates.vendorName || "Updated Vendor",
      status: updates.status || "draft",
      issueDate: updates.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: updates.dueDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10),
      subtotal: updates.subtotal || 0,
      taxAmount: updates.taxAmount || 0,
      total: updates.total || 0,
      items: updates.items || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: updates.notes || ""
    } as Bill;
  } catch (error) {
    console.error(`Error updating bill ${id}:`, error);
    throw error;
  }
};

export const deleteBill = async (id: string): Promise<boolean> => {
  try {
    // Simulation of API call to delete a bill
    console.log(`Deleting bill ${id}`);
    
    // In a real implementation, we would use Supabase or another API
    // Example of a Supabase implementation:
    // const { error } = await supabase
    //   .from('bills')
    //   .delete()
    //   .eq('id', id);
    
    // For now, simulate a successful deletion
    return true;
  } catch (error) {
    console.error(`Error deleting bill ${id}:`, error);
    throw error;
  }
};

// For invoices update and delete:
export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
  try {
    // Simulation of API call to update an invoice
    console.log(`Updating invoice ${id} with`, updates);
    
    // In a real implementation, we would use Supabase or another API
    // For now, simulate a successful response
    return {
      id,
      ...updates,
      invoiceNumber: updates.invoiceNumber || `INV-${Math.floor(Math.random() * 10000)}`,
      customerName: updates.customerName || "Updated Customer",
      status: updates.status || "draft",
      issueDate: updates.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: updates.dueDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10),
      subtotal: updates.subtotal || 0,
      taxAmount: updates.taxAmount || 0,
      total: updates.total || 0,
      items: updates.items || [],
      createdAt: updates.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: updates.notes || ""
    } as Invoice;
  } catch (error) {
    console.error(`Error updating invoice ${id}:`, error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    // Simulation of API call to delete an invoice
    console.log(`Deleting invoice ${id}`);
    
    // In a real implementation, we would use Supabase or another API
    // For now, simulate a successful deletion
    return Promise.resolve();
  } catch (error) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw error;
  }
};
