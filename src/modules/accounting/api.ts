import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "@/services/userLogs";
import { 
  AccountingModuleConfig, 
  Account, 
  Transaction,
  TransactionLine,
  Invoice, 
  InvoiceItem,
  Bill,
  BillItem,
  PayrollRun,
  PayrollItem,
  AccountType
} from "./types";

/**
 * Retrieves the accounting module configuration from the module registry
 */
export const getAccountingConfig = async (organizationId: string): Promise<AccountingModuleConfig | null> => {
  try {
    // First try to get from accounting_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('accounting_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();
      
    if (settingsError) {
      console.error('Error fetching accounting settings:', settingsError);
      
      // Fall back to module_registry if accounting_settings not found
      const { data: registryData, error: registryError } = await supabase
        .from('module_registry')
        .select('config, is_enabled')
        .eq('organization_id', organizationId)
        .eq('module_name', 'accounting')
        .maybeSingle();
        
      if (registryError) throw registryError;
      
      if (!registryData) return null;
      
      // Convert from module_registry format to our type
      const configData = registryData.config as Record<string, any>;
      
      return {
        defaultCurrency: configData?.default_currency || 'USD',
        fiscalYearStart: configData?.fiscal_year_start || '01-01',
        taxRate: Number(configData?.tax_rate || 0),
        isEnabled: Boolean(registryData.is_enabled)
      };
    }
    
    if (!settingsData) return null;
    
    // Convert from database format to our type
    return {
      defaultCurrency: settingsData.default_currency,
      fiscalYearStart: settingsData.fiscal_year_start.split('T')[0], // Extract date part only
      taxRate: Number(settingsData.tax_rate),
      isEnabled: true // If settings exist, module is enabled
    };
  } catch (error) {
    console.error('Error fetching accounting config:', error);
    return null;
  }
};

/**
 * Updates the accounting module configuration
 */
export const updateAccountingConfig = async (
  organizationId: string, 
  config: Partial<AccountingModuleConfig>
): Promise<void> => {
  try {
    // Transform our config type to database format
    const dbUpdates: Record<string, any> = {};
    
    if (config.defaultCurrency) dbUpdates.default_currency = config.defaultCurrency;
    if (config.fiscalYearStart) dbUpdates.fiscal_year_start = config.fiscalYearStart;
    if (config.taxRate !== undefined) dbUpdates.tax_rate = config.taxRate;
    
    // Update accounting_settings
    const { error: settingsError } = await supabase
      .from('accounting_settings')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId);
      
    if (settingsError) throw settingsError;
    
    // Also update module_registry if the isEnabled property is being changed
    if (config.isEnabled !== undefined) {
      // Transform our config type to database format for module_registry
      const registryConfig: Record<string, any> = {};
      
      if (config.defaultCurrency) registryConfig.default_currency = config.defaultCurrency;
      if (config.fiscalYearStart) registryConfig.fiscal_year_start = config.fiscalYearStart;
      if (config.taxRate !== undefined) registryConfig.tax_rate = config.taxRate;
      
      // Get existing config first
      const { data: existingData } = await supabase
        .from('module_registry')
        .select('config')
        .eq('organization_id', organizationId)
        .eq('module_name', 'accounting')
        .maybeSingle();
        
      // Merge with existing config
      const existingConfig = (existingData?.config as Record<string, any>) || {};
      const mergedConfig = {
        ...existingConfig,
        ...registryConfig
      };
      
      // Update the registry
      const { error } = await supabase
        .from('module_registry')
        .update({ 
          config: mergedConfig,
          is_enabled: config.isEnabled
        })
        .eq('organization_id', organizationId)
        .eq('module_name', 'accounting');
        
      if (error) throw error;
    }
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'update_config',
      metadata: { config: dbUpdates }
    });
  } catch (error) {
    console.error('Error updating accounting config:', error);
    throw error;
  }
};

// ACCOUNTS API

/**
 * Fetches accounts from the database
 */
export const fetchAccounts = async (organizationId: string): Promise<Account[]> => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('code', { ascending: true });
      
    if (error) throw error;
    
    if (!data) return [];
    
    // Get account balances from view
    const { data: balances, error: balancesError } = await supabase
      .from('account_balances')
      .select('account_id, balance')
      .eq('organization_id', organizationId);
      
    if (balancesError) {
      console.error('Error fetching account balances:', balancesError);
      // Continue with zero balances if the balances query fails
    }
    
    // Create a map of account ID to balance
    const balanceMap = new Map<string, number>();
    balances?.forEach(item => {
      balanceMap.set(item.account_id, item.balance);
    });
    
    // Map database accounts to our Account type
    return data.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type as Account['type'],
      description: account.description || undefined,
      isActive: account.is_active,
      balance: balanceMap.get(account.id) || 0,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
};

/**
 * Creates a new account
 */
export const createAccount = async (
  organizationId: string,
  accountData: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>
): Promise<Account | null> => {
  try {
    // Format data for the database
    const dbAccount = {
      organization_id: organizationId,
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      description: accountData.description,
      is_active: accountData.isActive,
    };
    
    const { data, error } = await supabase
      .from('accounts')
      .insert(dbAccount)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'create_account',
      recordId: data.id,
      metadata: { account_name: data.name, account_type: data.type }
    });
    
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type as Account['type'],
      description: data.description || undefined,
      isActive: data.is_active,
      balance: 0, // New account has zero balance
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return null;
  }
};

/**
 * Updates an existing account
 */
export const updateAccount = async (
  accountId: string,
  accountData: Partial<Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>>
): Promise<Account | null> => {
  try {
    // Format data for the database
    const dbUpdates: Record<string, any> = {};
    
    if (accountData.code !== undefined) dbUpdates.code = accountData.code;
    if (accountData.name !== undefined) dbUpdates.name = accountData.name;
    if (accountData.type !== undefined) dbUpdates.type = accountData.type;
    if (accountData.description !== undefined) dbUpdates.description = accountData.description;
    if (accountData.isActive !== undefined) dbUpdates.is_active = accountData.isActive;
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('accounts')
      .update(dbUpdates)
      .eq('id', accountId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Get current balance
    const { data: balanceData } = await supabase
      .from('account_balances')
      .select('balance')
      .eq('account_id', accountId)
      .maybeSingle();
      
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'update_account',
      recordId: data.id,
      metadata: { account_name: data.name, account_type: data.type }
    });
    
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type as Account['type'],
      description: data.description || undefined,
      isActive: data.is_active,
      balance: balanceData?.balance || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return null;
  }
};

/**
 * Deletes an account (or marks it as inactive)
 */
export const deleteAccount = async (accountId: string): Promise<boolean> => {
  try {
    // Check if account has any transactions
    const { count, error: countError } = await supabase
      .from('transaction_lines')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
      
    if (countError) throw countError;
    
    if (count && count > 0) {
      // Account has transactions, so just mark it as inactive
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', accountId);
        
      if (error) throw error;
      
      // Log the action
      await logUserAction({
        module: 'accounting',
        action: 'deactivate_account',
        recordId: accountId
      });
    } else {
      // Account has no transactions, so it can be safely deleted
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);
        
      if (error) throw error;
      
      // Log the action
      await logUserAction({
        module: 'accounting',
        action: 'delete_account',
        recordId: accountId
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    return false;
  }
};

// TRANSACTIONS API

/**
 * Fetches transactions
 */
export const fetchTransactions = async (
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: Transaction['status'];
    search?: string;
  }
): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_lines:transaction_lines(*)
      `)
      .eq('organization_id', organizationId);
    
    // Apply filters
    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('transaction_date', { ascending: false });
      
    if (error) throw error;
    
    if (!data) return [];
    
    // Map database transactions to our Transaction type
    return data.map(transaction => {
      const transactionLines = transaction.transaction_lines as any[];
      
      return {
        id: transaction.id,
        date: transaction.transaction_date,
        description: transaction.description,
        referenceNumber: transaction.reference_number || undefined,
        status: transaction.status as Transaction['status'],
        lines: transactionLines.map(line => ({
          id: line.id,
          accountId: line.account_id,
          description: line.description || undefined,
          debitAmount: line.debit_amount,
          creditAmount: line.credit_amount,
          createdAt: line.created_at,
          updatedAt: line.updated_at
        })),
        createdBy: transaction.created_by || undefined,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      };
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

/**
 * Creates a new transaction with lines
 */
export const createTransaction = async (
  organizationId: string,
  userId: string,
  transaction: Omit<Transaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & {
    lines: Omit<TransactionLine, 'id' | 'createdAt' | 'updatedAt'>[]
  }
): Promise<Transaction | null> => {
  try {
    // First, create the transaction record
    const { data: createdTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        transaction_date: transaction.date,
        description: transaction.description,
        reference_number: transaction.referenceNumber || null,
        status: transaction.status
      })
      .select()
      .single();
      
    if (transactionError) throw transactionError;
    
    // Then, create the transaction lines
    const transactionLines = transaction.lines.map(line => ({
      transaction_id: createdTransaction.id,
      account_id: line.accountId,
      description: line.description || null,
      debit_amount: line.debitAmount,
      credit_amount: line.creditAmount
    }));
    
    const { error: linesError } = await supabase
      .from('transaction_lines')
      .insert(transactionLines);
      
    if (linesError) throw linesError;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'create_transaction',
      recordId: createdTransaction.id,
      metadata: { description: createdTransaction.description, status: createdTransaction.status }
    });
    
    // Fetch the created transaction with its lines
    return await getTransactionById(createdTransaction.id);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
};

/**
 * Gets a transaction by ID
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_lines:transaction_lines(*)
      `)
      .eq('id', transactionId)
      .single();
      
    if (error) throw error;
    
    if (!data) return null;
    
    const transactionLines = data.transaction_lines as any[];
    
    return {
      id: data.id,
      date: data.transaction_date,
      description: data.description,
      referenceNumber: data.reference_number || undefined,
      status: data.status as Transaction['status'],
      lines: transactionLines.map(line => ({
        id: line.id,
        accountId: line.account_id,
        description: line.description || undefined,
        debitAmount: line.debit_amount,
        creditAmount: line.credit_amount,
        createdAt: line.created_at,
        updatedAt: line.updated_at
      })),
      createdBy: data.created_by || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching transaction by ID:', error);
    return null;
  }
};

/**
 * Updates a transaction
 * Note: This does not update transaction lines - for simplicity, use deleteTransaction and createTransaction
 * if transaction lines need to be modified
 */
export const updateTransaction = async (
  transactionId: string,
  transactionData: Partial<Omit<Transaction, 'id' | 'lines' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<Transaction | null> => {
  try {
    // Format data for the database
    const dbUpdates: Record<string, any> = {};
    
    if (transactionData.date !== undefined) dbUpdates.transaction_date = transactionData.date;
    if (transactionData.description !== undefined) dbUpdates.description = transactionData.description;
    if (transactionData.referenceNumber !== undefined) dbUpdates.reference_number = transactionData.referenceNumber;
    if (transactionData.status !== undefined) dbUpdates.status = transactionData.status;
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('id', transactionId);
      
    if (error) throw error;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'update_transaction',
      recordId: transactionId,
      metadata: { status: transactionData.status }
    });
    
    // Return the updated transaction
    return await getTransactionById(transactionId);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
};

/**
 * Deletes a transaction and its lines
 */
export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    // This will cascade delete to transaction_lines due to foreign key constraints
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
      
    if (error) throw error;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'delete_transaction',
      recordId: transactionId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// INVOICES API

/**
 * Creates a contact if it doesn't exist
 */
const createOrUpdateContact = async (
  organizationId: string,
  contact: {
    name: string;
    type: 'customer' | 'vendor' | 'employee';
    email?: string;
    phone?: string;
    address?: string;
  }
): Promise<string | null> => {
  try {
    // Check if contact exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', contact.name)
      .eq('type', contact.type)
      .maybeSingle();
      
    if (existingContact) {
      // Update existing contact
      const { error } = await supabase
        .from('contacts')
        .update({
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);
        
      if (error) throw error;
      
      return existingContact.id;
    } else {
      // Create new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: organizationId,
          name: contact.name,
          type: contact.type,
          email: contact.email,
          phone: contact.phone,
          address: contact.address
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      return data.id;
    }
  } catch (error) {
    console.error('Error creating/updating contact:', error);
    return null;
  }
};

/**
 * Fetches invoices
 */
export const fetchInvoices = async (
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: Invoice['status'];
    search?: string;
  }
): Promise<Invoice[]> => {
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        contacts:contact_id(*),
        invoice_items:invoice_items(*)
      `)
      .eq('organization_id', organizationId);
    
    // Apply filters
    if (filters?.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,contacts.name.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('issue_date', { ascending: false });
      
    if (error) throw error;
    
    if (!data) return [];
    
    // Map database invoices to our Invoice type
    return data.map(invoice => {
      const invoiceItems = invoice.invoice_items as any[];
      const contact = invoice.contacts as any;
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId: invoice.contact_id,
        customerName: contact?.name || 'Unknown Customer',
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        items: invoiceItems.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxRate: item.tax_rate,
          amount: item.amount
        })),
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount,
        total: invoice.total,
        status: invoice.status as Invoice['status'],
        notes: invoice.notes || undefined,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at
      };
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

// BILLS API

/**
 * Fetches bills from the database
 */
export const fetchBills = async (
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: Bill['status'];
    search?: string;
  }
): Promise<Bill[]> => {
  try {
    let query = supabase
      .from('bills')
      .select(`
        *,
        contacts:contact_id(*),
        bill_items:bill_items(*)
      `)
      .eq('organization_id', organizationId);
    
    // Apply filters
    if (filters?.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(`bill_number.ilike.%${filters.search}%,contacts.name.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('issue_date', { ascending: false });
      
    if (error) throw error;
    
    if (!data) return [];
    
    // Map database bills to our Bill type
    return data.map(bill => {
      const billItems = bill.bill_items as any[];
      const contact = bill.contacts as any;
      
      return {
        id: bill.id,
        billNumber: bill.bill_number,
        vendorId: bill.contact_id,
        vendorName: contact?.name || 'Unknown Vendor',
        issueDate: bill.issue_date,
        dueDate: bill.due_date,
        items: billItems.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxRate: item.tax_rate,
          amount: item.amount
        })),
        subtotal: bill.subtotal,
        taxAmount: bill.tax_amount,
        total: bill.total,
        status: bill.status as Bill['status'],
        notes: bill.notes || undefined,
        createdAt: bill.created_at,
        updatedAt: bill.updated_at
      };
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
};

/**
 * Creates a new bill
 */
export const createBill = async (
  organizationId: string,
  billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Bill | null> => {
  try {
    // First, ensure the vendor exists
    const vendorId = await createOrUpdateContact(
      organizationId,
      {
        name: billData.vendorName,
        type: 'vendor'
      }
    );
    
    if (!vendorId) {
      throw new Error('Failed to create or update vendor contact');
    }
    
    // Create the bill
    const { data: bill, error } = await supabase
      .from('bills')
      .insert({
        organization_id: organizationId,
        contact_id: vendorId,
        bill_number: billData.billNumber,
        issue_date: billData.issueDate,
        due_date: billData.dueDate,
        subtotal: billData.subtotal,
        tax_amount: billData.taxAmount,
        total: billData.total,
        status: billData.status,
        notes: billData.notes || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create bill items
    const billItems = billData.items.map(item => ({
      bill_id: bill.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      amount: item.amount
    }));
    
    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems);
      
    if (itemsError) throw itemsError;
    
    return {
      id: bill.id,
      billNumber: bill.bill_number,
      vendorId: bill.contact_id,
      vendorName: billData.vendorName,
      issueDate: bill.issue_date,
      dueDate: bill.due_date,
      subtotal: bill.subtotal,
      taxAmount: bill.tax_amount,
      total: bill.total,
      status: bill.status as Bill['status'],
      notes: bill.notes || undefined,
      items: billData.items,
      createdAt: bill.created_at,
      updatedAt: bill.updated_at
    };
  } catch (error) {
    console.error('Error creating bill:', error);
    return null;
  }
};

/**
 * Creates a new invoice
 */
export const createInvoice = async (
  organizationId: string,
  invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Invoice | null> => {
  try {
    // First, ensure the customer exists
    const customerId = await createOrUpdateContact(
      organizationId,
      {
        name: invoiceData.customerName,
        type: 'customer'
      }
    );
    
    if (!customerId) {
      throw new Error('Failed to create or update customer contact');
    }
    
    // Create the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        contact_id: customerId,
        invoice_number: invoiceData.invoiceNumber,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total: invoiceData.total,
        status: invoiceData.status,
        notes: invoiceData.notes || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create invoice items
    const invoiceItems = invoiceData.items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      amount: item.amount
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);
      
    if (itemsError) throw itemsError;
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.contact_id,
      customerName: invoiceData.customerName,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      status: invoice.status as Invoice['status'],
      notes: invoice.notes || undefined,
      items: invoiceData.items,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return null;
  }
};

/**
 * Updates an existing invoice
 */
export const updateExistingInvoice = async (
  invoiceId: string,
  invoiceData: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Invoice | null> => {
  try {
    // Get the invoice to update (including organization_id)
    const { data: existingInvoice, error: getError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (getError) throw getError;
    
    // Prepare updates
    const updates: Record<string, any> = {};
    
    if (invoiceData.invoiceNumber) updates.invoice_number = invoiceData.invoiceNumber;
    if (invoiceData.issueDate) updates.issue_date = invoiceData.issueDate;
    if (invoiceData.dueDate) updates.due_date = invoiceData.dueDate;
    if (invoiceData.subtotal !== undefined) updates.subtotal = invoiceData.subtotal;
    if (invoiceData.taxAmount !== undefined) updates.tax_amount = invoiceData.taxAmount;
    if (invoiceData.total !== undefined) updates.total = invoiceData.total;
    if (invoiceData.status) updates.status = invoiceData.status;
    if (invoiceData.notes !== undefined) updates.notes = invoiceData.notes || null;
    
    // Update customer if needed
    if (invoiceData.customerId && invoiceData.customerName) {
      const customerId = await createOrUpdateContact(
        existingInvoice.organization_id,
        {
          name: invoiceData.customerName,
          type: 'customer'
        }
      );
      
      if (customerId) {
        updates.contact_id = customerId;
      }
    }
    
    // Update invoice
    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update invoice items if provided
    if (invoiceData.items) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
        
      if (deleteError) throw deleteError;
      
      // Create new items
      const invoiceItems = invoiceData.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        amount: item.amount
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
        
      if (itemsError) throw itemsError;
    }
    
    // Get the updated invoice items
    const { data: updatedItems, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);
      
    if (itemsError) throw itemsError;
    
    // Get the customer name
    const { data: contact } = await supabase
      .from('contacts')
      .select('name')
      .eq('id', updatedInvoice.contact_id)
      .single();
      
    return {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoice_number,
      customerId: updatedInvoice.contact_id,
      customerName: contact?.name || 'Unknown Customer',
      issueDate: updatedInvoice.issue_date,
      dueDate: updatedInvoice.due_date,
      subtotal: updatedInvoice.subtotal,
      taxAmount: updatedInvoice.tax_amount,
      total: updatedInvoice.total,
      status: updatedInvoice.status as Invoice['status'],
      notes: updatedInvoice.notes || undefined,
      items: updatedItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        taxRate: item.tax_rate,
        amount: item.amount
      })),
      createdAt: updatedInvoice.created_at,
      updatedAt: updatedInvoice.updated_at
    };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return null;
  }
};

/**
 * Deletes an invoice
 */
export const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
  try {
    // Delete the invoice (will cascade to items due to foreign key constraints)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
};

// PAYROLL API

/**
 * Fetches payroll runs
 */
export const fetchPayrollRuns = async (
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: PayrollRun['status'];
  }
): Promise<PayrollRun[]> => {
  try {
    let query = supabase
      .from('payroll_runs')
      .select(`
        *,
        payroll_items:payroll_items(*)
      `)
      .eq('organization_id', organizationId);
    
    // Apply filters
    if (filters?.startDate) {
      query = query.gte('period_start', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('period_end', filters.endDate);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('payment_date', { ascending: false });
      
    if (error) throw error;
    
    if (!data) return [];
    
    // Map database payroll runs to our PayrollRun type
    return data.map(run => {
      const payrollItems = run.payroll_items as any[];
      
      return {
        id: run.id,
        name: run.name,
        period: `${run.period_start} to ${run.period_end}`,
        status: run.status as PayrollRun['status'],
        employeeCount: payrollItems.length,
        grossAmount: run.gross_amount,
        netAmount: run.net_amount,
        paymentDate: run.payment_date,
        createdAt: run.created_at,
        updatedAt: run.updated_at
      };
    });
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return [];
  }
};

/**
 * Cross-module integration - Get customer balance
 */
export const getCustomerBalance = async (customerId: string): Promise<number> => {
  try {
    // Calculate balance from invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total, status')
      .eq('contact_id', customerId);
      
    if (error) throw error;
    
    if (!invoices) return 0;
    
    // Calculate outstanding balance
    const balance = invoices.reduce((total, invoice) => {
      if (invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partially_paid') {
        return total + invoice.total;
      }
      return total;
    }, 0);
    
    return balance;
  } catch (error) {
    console.error('Error getting customer balance:', error);
    return 0;
  }
};

/**
 * Cross-module integration - Get vendor balance
 */
export const getVendorBalance = async (vendorId: string): Promise<number> => {
  try {
    // Calculate balance from bills
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total, status')
      .eq('contact_id', vendorId);
      
    if (error) throw error;
    
    if (!bills) return 0;
    
    // Calculate outstanding balance
    const balance = bills.reduce((total, bill) => {
      if (bill.status === 'pending' || bill.status === 'overdue' || bill.status === 'partially_paid') {
        return total + bill.total;
      }
      return total;
    }, 0);
    
    return balance;
  } catch (error) {
    console.error('Error getting vendor balance:', error);
    return 0;
  }
};

/**
 * Adjust account balance by creating a transaction
 */
export const adjustAccountBalance = async (
  organizationId: string,
  userId: string,
  accountId: string,
  amount: number,
  description: string
): Promise<Account | null> => {
  try {
    // Create a transaction to adjust the balance
    const transaction = {
      date: new Date().toISOString().split('T')[0],
      description: `Balance adjustment: ${description}`,
      status: 'posted' as const,
      lines: []
    };
    
    // Get the account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountError) throw accountError;
    
    // Determine if this is a debit or credit adjustment based on account type
    const accountType = account.type as AccountType;
    let debitAccount: string | null = null;
    let creditAccount: string | null = null;
    
    // Find or create adjustment account
    const { data: adjustmentAccounts, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('name', 'Balance Adjustment Account')
      .maybeSingle();
      
    if (accError) throw accError;
    
    let adjustmentAccountId: string;
    
    if (!adjustmentAccounts) {
      // Create an adjustment account if it doesn't exist
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          organization_id: organizationId,
          code: 'ADJ',
          name: 'Balance Adjustment Account',
          type: 'equity' as AccountType,
          description: 'Account used for balance adjustments',
          is_active: true
        })
        .select()
        .single();
        
      if (createError) throw createError;
      adjustmentAccountId = newAccount.id;
    } else {
      adjustmentAccountId = adjustmentAccounts.id;
    }
    
    // For asset and expense accounts:
    // - Positive adjustment: Debit the account (increase)
    // - Negative adjustment: Credit the account (decrease)
    //
    // For liability, equity, revenue accounts:
    // - Positive adjustment: Credit the account (increase)
    // - Negative adjustment: Debit the account (decrease)
    if (accountType === 'asset' || accountType === 'expense') {
      if (amount >= 0) {
        debitAccount = accountId;
        creditAccount = adjustmentAccountId;
      } else {
        debitAccount = adjustmentAccountId;
        creditAccount = accountId;
      }
    } else {
      // liability, equity, revenue
      if (amount >= 0) {
        debitAccount = adjustmentAccountId;
        creditAccount = accountId;
      } else {
        debitAccount = accountId;
        creditAccount = adjustmentAccountId;
      }
    }
    
    // Create transaction lines
    const absAmount = Math.abs(amount);
    transaction.lines = [
      {
        accountId: debitAccount,
        debitAmount: absAmount,
        creditAmount: 0
      },
      {
        accountId: creditAccount,
        debitAmount: 0,
        creditAmount: absAmount
      }
    ];
    
    // Create the adjustment transaction
    const newTransaction = await createTransaction(organizationId, userId, transaction);
    
    if (!newTransaction) {
      throw new Error('Failed to create adjustment transaction');
    }
    
    // Get the updated account with new balance
    const { data: updatedAccount, error: updatedError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
      
    if (updatedError) throw updatedError;
    
    // Get current balance
    const { data: balanceData } = await supabase
      .from('account_balances')
      .select('balance')
      .eq('account_id', accountId)
      .maybeSingle();
      
    // Return the updated account
    return {
      id: updatedAccount.id,
      code: updatedAccount.code,
      name: updatedAccount.name,
      type: updatedAccount.type as AccountType,
      description: updatedAccount.description || undefined,
      isActive: updatedAccount.is_active,
      balance: balanceData?.balance || 0,
      createdAt: updatedAccount.created_at,
      updatedAt: updatedAccount.updated_at
    };
  } catch (error) {
    console.error('Error adjusting account balance:', error);
    return null;
  }
};
