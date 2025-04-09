
import { Transaction, TransactionLine } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { 
  mapTransactionFromApi, 
  mapTransactionLineFromApi,
  mapTransactionToApiFormat,
  mapTransactionLineToApiFormat
} from "../utils/mappers";

/**
 * Interface defining the standard operations for transactions
 * This abstraction will allow us to swap implementations (native, Xero, etc.)
 */
export interface ITransactionService {
  createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt"> & { organization_id: string }): Promise<Transaction>;
  getTransactions(options?: { 
    filter?: string; 
    sort?: string; 
    page?: number; 
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null>;
  deleteTransaction(id: string): Promise<boolean>;
}

/**
 * Native implementation of the TransactionService interface that uses Supabase
 */
export class SupabaseTransactionService implements ITransactionService {
  /**
   * Creates a new transaction in the database
   * @param transaction Transaction data to insert
   * @returns The created transaction with all details
   */
  async createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt"> & { organization_id: string }): Promise<Transaction> {
    try {
      console.log('Creating transaction with data:', transaction);
      
      // Validate the transaction (ensure balanced, has required fields)
      if (!this.validateTransaction(transaction)) {
        throw new Error('Transaction validation failed: Transaction must be balanced (debits = credits)');
      }
      
      // Map transaction to database format
      const transactionData = {
        ...mapTransactionToApiFormat(transaction),
        organization_id: transaction.organization_id
      };

      // Check for null values in required fields
      const requiredFields = ['organization_id', 'transaction_date', 'description', 'status'];
      const missingFields = requiredFields.filter(field => transactionData[field] === null || transactionData[field] === undefined);
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Insert transaction
      const { data: insertedTransaction, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting transaction:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        throw error;
      }
      
      // Insert transaction lines
      if (transaction.lines && transaction.lines.length > 0) {
        const transactionLines = transaction.lines.map(line => 
          mapTransactionLineToApiFormat(line, insertedTransaction.id)
        );

        console.log('Transaction lines data:', transactionLines);

        const { error: linesError } = await supabase
          .from('transaction_lines')
          .insert(transactionLines);

        if (linesError) {
          console.error('Error inserting transaction lines:', linesError);
          console.error('Error details:', linesError.details, linesError.hint, linesError.message);
          
          // Attempt to delete the transaction if line insertion fails
          await supabase.from('transactions').delete().eq('id', insertedTransaction.id);
          
          throw linesError;
        }
      }

      // Fetch the inserted transaction with its lines
      const { data: transactionWithLines, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `)
        .eq('id', insertedTransaction.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching transaction with lines:', fetchError);
        throw fetchError;
      }

      return mapTransactionFromApi(transactionWithLines);
    } catch (error) {
      console.error(`Error creating transaction:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all transactions with optional filtering, sorting and pagination
   */
  async getTransactions(options?: { 
    filter?: string; 
    sort?: string; 
    page?: number; 
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `);
      
      // Apply date range filtering
      if (options?.startDate) {
        query = query.gte('transaction_date', options.startDate);
      }
      
      if (options?.endDate) {
        query = query.lte('transaction_date', options.endDate);
      }
      
      // Apply status filtering
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      // Apply general filtering if provided
      if (options?.filter) {
        const [field, value] = options.filter.split('=');
        if (field && value) {
          query = query.eq(field, value);
        }
      }
      
      // Apply text search if provided
      if (options?.search) {
        query = query.or(`description.ilike.%${options.search}%,reference_number.ilike.%${options.search}%`);
      }
      
      // Apply sorting if provided
      if (options?.sort) {
        const [field, direction] = options.sort.split('.');
        if (field) {
          const isAsc = direction !== 'desc';
          query = query.order(field, { ascending: isAsc });
        }
      } else {
        // Default sorting by transaction_date, descending
        query = query.order('transaction_date', { ascending: false });
      }
      
      // Apply pagination if provided
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      // Cast the data to any[] explicitly to avoid deep type instantiation
      return (data || []).map((item: any) => mapTransactionFromApi(item));
    } catch (error) {
      console.error('Error in getTransactions:', error);
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  /**
   * Retrieves a single transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching transaction ${id}:`, error);
        throw error;
      }

      if (!data) return null;
      return mapTransactionFromApi(data);
    } catch (error) {
      console.error(`Error in getTransactionById for ${id}:`, error);
      return null;
    }
  }

  /**
   * Updates an existing transaction
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      // For complex updates like changing transaction lines, it's often simpler
      // to delete the old transaction and create a new one with the updates
      if (updates.lines) {
        const existingTransaction = await this.getTransactionById(id);
        if (!existingTransaction) {
          throw new Error(`Transaction with id ${id} not found`);
        }
        
        // Delete the old transaction
        const deleteSuccess = await this.deleteTransaction(id);
        if (!deleteSuccess) {
          throw new Error(`Failed to delete transaction ${id} during update`);
        }
        
        // Create a new transaction with the merged data
        const updatedTransaction: any = {
          ...existingTransaction,
          ...updates,
          organization_id: existingTransaction.createdBy || "test-org-id", // Reuse the organization ID or use default
        };
        
        // Remove fields that shouldn't be in the create call
        delete updatedTransaction.id;
        delete updatedTransaction.createdAt;
        delete updatedTransaction.updatedAt;
        
        return this.createTransaction(updatedTransaction);
      }
      
      // For simpler updates (just status, description, etc.), perform a direct update
      const updateData: any = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.transaction_date = updates.date;
      if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      updateData.updated_at = new Date().toISOString();

      // Update the transaction
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;

      // Fetch the updated transaction with its lines
      const { data: transactionWithLines, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!transactionWithLines) return null;

      return mapTransactionFromApi(transactionWithLines);
    } catch (error) {
      console.error(`Error updating transaction ${id}:`, error);
      return null;
    }
  }

  /**
   * Deletes a transaction and its lines
   */
  async deleteTransaction(id: string): Promise<boolean> {
    try {
      // Delete transaction lines first (should cascade, but just to be safe)
      const { error: linesError } = await supabase
        .from('transaction_lines')
        .delete()
        .eq('transaction_id', id);

      if (linesError) throw linesError;

      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      return false;
    }
  }

  /**
   * Validates a transaction according to accounting rules
   * - Ensures debits equal credits (double-entry principle)
   * - Checks for required fields and correct data types
   */
  validateTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): boolean {
    // Ensure transaction has lines
    if (!transaction.lines || transaction.lines.length < 2) {
      console.error('Transaction must have at least two lines');
      return false;
    }
    
    // Calculate total debits and credits
    const totalDebits = transaction.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = transaction.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    
    // Check if transaction is balanced (allowing for small rounding errors)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    if (!isBalanced) {
      console.error(`Transaction is not balanced: Debits=${totalDebits}, Credits=${totalCredits}`);
      return false;
    }
    
    // Check required fields
    if (!transaction.date) {
      console.error('Transaction must have a date');
      return false;
    }
    
    if (!transaction.description) {
      console.error('Transaction must have a description');
      return false;
    }
    
    // Validate each line
    for (const line of transaction.lines) {
      if (!line.accountId) {
        console.error('Each transaction line must have an account');
        return false;
      }
      
      // Ensure either debit or credit is zero (not both or neither)
      if ((line.debitAmount > 0 && line.creditAmount > 0) || 
          (line.debitAmount === 0 && line.creditAmount === 0)) {
        console.error('Each transaction line must have either a debit or credit amount, not both or neither');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Returns predefined transaction templates
   */
  async getTransactionTemplates(): Promise<{ name: string, template: Partial<Transaction> }[]> {
    // Sample templates for common transaction patterns
    return [];
  }
}

// Default export of the native implementation
export default new SupabaseTransactionService();
