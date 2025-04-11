import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { Account } from '@/modules/accounting/types';

export class AccountService {
  private supabase: SupabaseClient<Database>;
  private organizationId: string;

  constructor(client: SupabaseClient<Database>, organizationId: string) {
    this.supabase = client;
    this.organizationId = organizationId;
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (error) {
        console.error('Error fetching accounts:', error);
        return [];
      }

      return data.map(this.mapAccountFromDB);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  async getAccountById(id: string): Promise<Account | null> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching account ${id}:`, error);
        return null;
      }

      return data ? this.mapAccountFromDB(data) : null;
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error);
      return null;
    }
  }

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Account | null> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .insert([
          {
            ...account,
            organization_id: this.organizationId,
          },
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return null;
      }

      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
    }
  }

  async updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>>): Promise<Account | null> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', this.organizationId)
        .select('*')
        .single();

      if (error) {
        console.error(`Error updating account ${id}:`, error);
        return null;
      }

      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      return null;
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('organization_id', this.organizationId);

      if (error) {
        console.error(`Error deleting account ${id}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      return false;
    }
  }

  async adjustAccountBalance(
    accountId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Get current account to verify it belongs to the organization
      const account = await this.getAccountById(accountId);

      if (!account) {
        throw new Error(`Account ${accountId} not found or not accessible`);
      }

      // Use the correct table structure to update account balances
      const { error } = await this.supabase
        .from('account_balances')
        .insert([{
          account_id: accountId,
          organization_id: this.organizationId,
          balance: amount
        }]);

      if (error) {
        console.error('Error adjusting account balance:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in adjustAccountBalance:', error);
      return false;
    }
  }

  private mapAccountFromDB(data: any): Account {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type,
      description: data.description,
      isActive: data.is_active,
      balance: data.balance || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
