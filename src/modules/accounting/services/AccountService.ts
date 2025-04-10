
import { SupabaseClient } from "@supabase/supabase-js";
import { Account, AccountType } from "../types";
import { Database } from "@/integrations/supabase/types";

export class AccountService {
  private supabase: SupabaseClient<Database>;
  private organizationId: string;

  constructor(client: SupabaseClient<Database>, organizationId: string) {
    this.supabase = client;
    this.organizationId = organizationId;
  }

  async createAccount(account: Omit<Account, "id" | "createdAt" | "updatedAt" | "balance">): Promise<Account> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .insert([{
          code: account.code,
          name: account.name,
          description: account.description,
          type: account.type,
          is_active: account.isActive,
          organization_id: this.organizationId // Adding organization_id which is required
        }])
        .select('*')
        .single();

      if (error) throw error;

      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('organization_id', this.organizationId) // Filter by organization_id
        .order('code', { ascending: true });

      if (error) throw error;

      return (data as any[]).map(this.mapAccountFromDB);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  }

  async getAccountById(id: string): Promise<Account | null> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .eq('organization_id', this.organizationId) // Filter by organization_id
        .single();

      if (error) throw error;

      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error);
      return null;
    }
  }

  async getAccountsByType(type: AccountType): Promise<Account[]> {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('type', type)
        .eq('organization_id', this.organizationId) // Filter by organization_id
        .order('code', { ascending: true });

      if (error) throw error;

      return (data as any[]).map(this.mapAccountFromDB);
    } catch (error) {
      console.error(`Error fetching accounts by type ${type}:`, error);
      return [];
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    try {
      // Create a database-compatible update object
      const updateData: any = {};
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      // Removed the balance property as it's not accepted by the accounts table schema

      const { data, error } = await this.supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', this.organizationId) // Filter by organization_id
        .select('*')
        .single();

      if (error) throw error;

      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      throw error;
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('organization_id', this.organizationId); // Filter by organization_id

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      return false;
    }
  }

  async adjustAccountBalance(accountId: string, amount: number, description: string): Promise<Account> {
    // This would typically involve creating a transaction rather than directly updating the balance
    // For now, we'll implement a simplified version using the account_balances table
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error(`Account ${accountId} not found`);
      
      // Update or insert into account_balances table with only the fields that exist
      const { data: balanceData, error: balanceError } = await this.supabase
        .from('account_balances')
        .upsert({
          account_id: accountId,
          organization_id: this.organizationId,
          balance: amount,
          // Only include fields that exist in the account_balances table
          type: account.type,
          name: account.name,
          code: account.code
        })
        .select();
        
      if (balanceError) throw balanceError;
      
      // Re-fetch the account to get the latest data
      const updatedAccount = await this.getAccountById(accountId);
      if (!updatedAccount) throw new Error(`Account ${accountId} not found after balance adjustment`);
      
      return updatedAccount;
    } catch (error) {
      console.error(`Error adjusting account balance ${accountId}:`, error);
      throw error;
    }
  }

  private mapAccountFromDB(data: any): Account {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || '',
      type: data.type as AccountType,
      balance: data.balance || 0,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
