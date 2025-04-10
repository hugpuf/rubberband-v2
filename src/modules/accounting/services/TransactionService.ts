import { SupabaseClient } from "@supabase/supabase-js";
import { 
  Transaction, 
  TransactionLine,
  Account,
  TransactionFilterParams
} from "../types";
import { Database } from "@/integrations/supabase/types";

export class TransactionService {
  private supabase: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.supabase = client;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }): Promise<Transaction> {
    try {
      // First insert the transaction
      const { data: transactionData, error: transactionError } = await this.supabase
        .from('transactions')
        .insert([{
          organization_id: transaction.organization_id,
          transaction_date: transaction.date,
          description: transaction.description,
          reference_number: transaction.referenceNumber,
          status: transaction.status,
          created_by: transaction.createdBy
        }] as any[])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Then insert the transaction lines
      if (transaction.lines && transaction.lines.length > 0) {
        const transactionLines = transaction.lines.map(line => ({
          transaction_id: transactionData.id,
          account_id: line.accountId,
          description: line.description,
          debit_amount: line.debitAmount,
          credit_amount: line.creditAmount
        }));

        const { error: linesError } = await this.supabase
          .from('transaction_lines')
          .insert(transactionLines as any[]);

        if (linesError) throw linesError;
      }

      // Fetch the complete transaction with its lines
      return this.getTransactionById(transactionData.id) as Promise<Transaction>;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async getTransactions(filters?: TransactionFilterParams): Promise<Transaction[]> {
    try {
      let query = this.supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `);

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
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }

      return data.map(this.mapTransactionFromDB);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching transaction:", error);
        return null;
      }

      return this.mapTransactionFromDB(data);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      // Convert updates to database format
      const updateData: any = {};
      if (updates.date !== undefined) updateData.transaction_date = updates.date;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
      if (updates.status !== undefined) updateData.status = updates.status;

      // Update the transaction
      const { data: updatedTransaction, error } = await this.supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // If there are lines to update
      if (updates.lines && updates.lines.length > 0) {
        // First, delete existing lines
        const { error: deleteError } = await this.supabase
          .from('transaction_lines')
          .delete()
          .eq('transaction_id', id);

        if (deleteError) throw deleteError;

        // Then insert new lines
        const transactionLines = updates.lines.map(line => ({
          transaction_id: id,
          account_id: line.accountId,
          description: line.description,
          debit_amount: line.debitAmount,
          credit_amount: line.creditAmount
        }));

        const { error: insertError } = await this.supabase
          .from('transaction_lines')
          .insert(transactionLines);

        if (insertError) throw insertError;
      }

      // Fetch the updated transaction with its lines
      const { data: transactionWithLines, error: fetchError } = await this.supabase
        .from('transactions')
        .select(`
          *,
          lines:transaction_lines(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return this.mapTransactionFromDB(transactionWithLines);
    } catch (error) {
      console.error(`Error updating transaction ${id}:`, error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      // Delete transaction lines first (should cascade, but just to be safe)
      const { error: linesError } = await this.supabase
        .from('transaction_lines')
        .delete()
        .eq('transaction_id', id);

      if (linesError) throw linesError;

      // Delete the transaction
      const { error } = await this.supabase
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
  
  // Cast database types to app types with proper type assertions
  private mapTransactionFromDB(data: any): Transaction {
    // For simplicity using any type to avoid deep nested type issues
    const result = {
      id: data.id,
      date: data.transaction_date,
      description: data.description,
      referenceNumber: data.reference_number,
      status: data.status as 'draft' | 'posted' | 'voided',
      lines: (data.lines || []).map((line: any) => ({
        id: line.id,
        accountId: line.account_id,
        description: line.description,
        debitAmount: line.debit_amount,
        creditAmount: line.credit_amount,
        createdAt: line.created_at,
        updatedAt: line.updated_at
      })),
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return result as Transaction;
  }
  
  // Add other methods as needed
}
