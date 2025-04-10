import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import {
  Transaction,
  TransactionLine,
  Account,
  TransactionFilterParams,
} from "../types";

export type TransactionWithLines = Transaction & {
  lines: (TransactionLine & { accounts: Pick<Account, 'id' | 'name' | 'code'> | null })[];
};

export class TransactionService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert([
          {
            transaction_date: transaction.date,
            description: transaction.description,
            reference_number: transaction.referenceNumber,
            status: transaction.status,
            created_by: transaction.createdBy,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        date: data.transaction_date,
        description: data.description,
        referenceNumber: data.reference_number,
        status: data.status,
        lines: [],
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<TransactionWithLines | null> {
    try {
      const { data: transaction, error: transactionError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (transactionError) {
        console.error('Error fetching transaction:', transactionError);
        return null;
      }

      const { data: lines, error: linesError } = await this.supabase
        .from('transaction_lines')
        .select('*, accounts(id, name, code)')
        .eq('transaction_id', id);

      if (linesError) {
        console.error('Error fetching transaction lines:', linesError);
        return {
          id: transaction.id,
          date: transaction.transaction_date,
          description: transaction.description,
          referenceNumber: transaction.reference_number,
          status: transaction.status,
          lines: [],
          createdBy: transaction.created_by,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
        };
      }

      return {
        id: transaction.id,
        date: transaction.transaction_date,
        description: transaction.description,
        referenceNumber: transaction.reference_number,
        status: transaction.status,
        lines: lines as TransactionLine[],
        createdBy: transaction.created_by,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  async getTransactions(filters?: TransactionFilterParams): Promise<TransactionWithLines[]> {
    try {
      let query = this.supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.dateRange?.from) {
        query = query.gte('transaction_date', filters.dateRange.from);
      }
      
      if (filters?.dateRange?.to) {
        query = query.lte('transaction_date', filters.dateRange.to);
      }
      
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data: transactions, error } = await query;
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      // Cast to any[] to avoid the excessively deep type instantiation
      const result = await Promise.all((transactions as any[]).map(async (transaction) => {
        const { data: lines, error: linesError } = await this.supabase
          .from('transaction_lines')
          .select('*, accounts(id, name, code)')
          .eq('transaction_id', transaction.id);
          
        if (linesError) {
          console.error('Error fetching transaction lines:', linesError);
          return {
            ...transaction,
            lines: []
          };
        }
        
        return {
          ...transaction,
          lines: lines || []
        };
      }));
      
      return result;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction | null> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .update({
          transaction_date: updates.date,
          description: updates.description,
          reference_number: updates.referenceNumber,
          status: updates.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        return null;
      }

      return {
        id: data.id,
        date: data.transaction_date,
        description: data.description,
        referenceNumber: data.reference_number,
        status: data.status,
        lines: [],
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  async createTransactionLine(line: Omit<TransactionLine, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionLine> {
    try {
      const { data, error } = await this.supabase
        .from('transaction_lines')
        .insert([
          {
            transaction_id: line.accountId, // Corrected: should be transaction_id
            account_id: line.accountId,
            description: line.description,
            debit_amount: line.debitAmount,
            credit_amount: line.creditAmount,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction line:', error);
        throw error;
      }

      return {
        id: data.id,
        accountId: data.account_id,
        description: data.description,
        debitAmount: data.debit_amount,
        creditAmount: data.credit_amount,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating transaction line:', error);
      throw error;
    }
  }

  async updateTransactionLine(id: string, updates: Partial<Omit<TransactionLine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TransactionLine | null> {
    try {
      const { data, error } = await this.supabase
        .from('transaction_lines')
        .update({
          account_id: updates.accountId,
          description: updates.description,
          debit_amount: updates.debitAmount,
          credit_amount: updates.creditAmount,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction line:', error);
        return null;
      }

      return {
        id: data.id,
        accountId: data.account_id,
        description: data.description,
        debitAmount: data.debit_amount,
        creditAmount: data.credit_amount,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating transaction line:', error);
      return null;
    }
  }

  async deleteTransactionLine(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('transaction_lines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction line:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting transaction line:', error);
      return false;
    }
  }
}
