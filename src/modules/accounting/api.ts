
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
  PayrollItem
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
      type: data.type,
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
      type: data.type,
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
  transactionData: Omit<Transaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & {
    lines: Omit<TransactionLine, 'id' | 'createdAt' | 'updatedAt'>[]
  }
): Promise<Transaction | null> => {
  try {
    // Start a Supabase transaction
    const { data, error } = await supabase.rpc('create_transaction', {
      org_id: organizationId,
      user_id: userId,
      transaction_date: transactionData.date,
      description_text: transactionData.description,
      reference_number: transactionData.referenceNumber || null,
      status_text: transactionData.status,
      transaction_lines: transactionData.lines.map(line => ({
        account_id: line.accountId,
        description: line.description || null,
        debit_amount: line.debitAmount,
        credit_amount: line.creditAmount
      }))
    });
    
    if (error) throw error;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'create_transaction',
      recordId: data.id,
      metadata: { description: transactionData.description, status: transactionData.status }
    });
    
    // Fetch the created transaction with its lines
    return await getTransactionById(data.id);
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
    // This is a placeholder for future implementation
    // This would typically query the database to calculate the customer's outstanding balance
    const { data, error } = await supabase.rpc('get_customer_balance', {
      customer_id: customerId
    });
    
    if (error) throw error;
    
    return data || 0;
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
    // This is a placeholder for future implementation
    // This would typically query the database to calculate the vendor's outstanding balance
    const { data, error } = await supabase.rpc('get_vendor_balance', {
      vendor_id: vendorId
    });
    
    if (error) throw error;
    
    return data || 0;
  } catch (error) {
    console.error('Error getting vendor balance:', error);
    return 0;
  }
};
