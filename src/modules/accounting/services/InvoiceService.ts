import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { Invoice, InvoiceItem } from "../types";

export type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

export interface InvoiceFilterParams {
  customerId?: string;
  status?: Invoice['status'];
  dateRange?: {
    from?: string;
    to?: string;
  };
  search?: string;
  limit?: number;
}

export class InvoiceService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoice.invoiceNumber,
            contact_id: invoice.customerId,
            contact_name: invoice.customerName,
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            subtotal: invoice.subtotal,
            tax_amount: invoice.taxAmount,
            total: invoice.total,
            status: invoice.status,
            notes: invoice.notes,
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<InvoiceWithItems | null> {
    try {
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        return null;
      }

      const { data: items, error: itemsError } = await this.supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) {
        console.error('Error fetching invoice items:', itemsError);
        return {
          ...invoice,
          items: []
        } as InvoiceWithItems;
      }

      return {
        ...invoice,
        items: items || []
      } as InvoiceWithItems;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async getInvoices(filters?: InvoiceFilterParams): Promise<InvoiceWithItems[]> {
    try {
      let query = this.supabase
        .from('invoices')
        .select('*')
        .order('issue_date', { ascending: false });
      
      if (filters?.customerId) {
        query = query.eq('contact_id', filters.customerId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.dateRange?.from) {
        query = query.gte('issue_date', filters.dateRange.from);
      }
      
      if (filters?.dateRange?.to) {
        query = query.lte('issue_date', filters.dateRange.to);
      }
      
      if (filters?.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data: invoices, error } = await query;
      
      if (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
      
      // Cast to any[] to avoid type instantiation error
      const result = await Promise.all((invoices as any[]).map(async (invoice) => {
        const { data: items, error: itemsError } = await this.supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);
          
        if (itemsError) {
          console.error('Error fetching invoice items:', itemsError);
          return {
            ...invoice,
            items: []
          };
        }
        
        return {
          ...invoice,
          items: items || []
        };
      }));
      
      return result;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async updateInvoice(id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(
          {
            invoice_number: invoice.invoiceNumber,
            contact_id: invoice.customerId,
            contact_name: invoice.customerName,
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            subtotal: invoice.subtotal,
            tax_amount: invoice.taxAmount,
            total: invoice.total,
            status: invoice.status,
            notes: invoice.notes,
          }
        )
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  async addItemToInvoice(invoiceId: string, item: Omit<InvoiceItem, 'id'>): Promise<InvoiceItem> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert([
          {
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate,
            amount: item.amount,
            account_id: item.accountId
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as InvoiceItem;
    } catch (error) {
      console.error('Error adding item to invoice:', error);
      throw error;
    }
  }

  async addItemsToInvoice(invoiceId: string, items: any[]): Promise<any[]> {
    try {
      const preparedItems = items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        amount: item.amount,
        account_id: item.accountId
      }));
      
      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert(preparedItems)
        .select();
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error adding items to invoice:', error);
      throw error;
    }
  }

  async updateItemInInvoice(id: string, item: Partial<Omit<InvoiceItem, 'id'>>): Promise<InvoiceItem> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_items')
        .update(
          {
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate,
            amount: item.amount,
            account_id: item.accountId
          }
        )
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as InvoiceItem;
    } catch (error) {
      console.error('Error updating item in invoice:', error);
      throw error;
    }
  }

  async deleteItemFromInvoice(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting item from invoice:', error);
      return false;
    }
  }
}
