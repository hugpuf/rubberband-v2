
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { Invoice, InvoiceItem } from "../types";

export type InvoiceWithItems = Invoice;

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

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { organization_id?: string }): Promise<Invoice> {
    try {
      if (!invoice.organization_id) {
        throw new Error("Organization ID is required");
      }
      
      const { data, error } = await this.supabase
        .from('invoices')
        .insert([
          {
            organization_id: invoice.organization_id,
            invoice_number: invoice.invoiceNumber,
            contact_id: invoice.customerId,
            contact_type: 'customer',
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

      // Insert invoice items if they exist
      if (invoice.items && invoice.items.length > 0) {
        await this.addItemsToInvoice(data.id, invoice.items);
      }
      
      // Get the full invoice with items
      return await this.getInvoiceById(data.id) as Invoice;
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
        return this.mapInvoiceFromDB(invoice, []);
      }

      return this.mapInvoiceFromDB(invoice, items || []);
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
      
      // Avoid type instantiation error by using any[] casting
      const result: InvoiceWithItems[] = [];
      
      for (const invoice of (invoices as any[])) {
        const { data: items, error: itemsError } = await this.supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);
          
        if (itemsError) {
          console.error('Error fetching invoice items:', itemsError);
          result.push(this.mapInvoiceFromDB(invoice, []));
        } else {
          result.push(this.mapInvoiceFromDB(invoice, items || []));
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async updateInvoice(id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> {
    try {
      const updateData: any = {};
      
      if (invoice.invoiceNumber !== undefined) updateData.invoice_number = invoice.invoiceNumber;
      if (invoice.customerId !== undefined) updateData.contact_id = invoice.customerId;
      if (invoice.customerName !== undefined) updateData.contact_name = invoice.customerName;
      if (invoice.issueDate !== undefined) updateData.issue_date = invoice.issueDate;
      if (invoice.dueDate !== undefined) updateData.due_date = invoice.dueDate;
      if (invoice.subtotal !== undefined) updateData.subtotal = invoice.subtotal;
      if (invoice.taxAmount !== undefined) updateData.tax_amount = invoice.taxAmount;
      if (invoice.total !== undefined) updateData.total = invoice.total;
      if (invoice.status !== undefined) updateData.status = invoice.status;
      if (invoice.notes !== undefined) updateData.notes = invoice.notes;
      
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If there are items to update
      if (invoice.items && invoice.items.length > 0) {
        // First delete existing items
        await this.supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);
          
        // Then add new items
        await this.addItemsToInvoice(id, invoice.items);
      }
      
      // Get the updated invoice with items
      return await this.getInvoiceById(id) as Invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      // Delete invoice items first
      await this.supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
        
      // Then delete the invoice
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

      return this.mapInvoiceItemFromDB(data);
    } catch (error) {
      console.error('Error adding item to invoice:', error);
      throw error;
    }
  }

  async addItemsToInvoice(invoiceId: string, items: Omit<InvoiceItem, 'id'>[]): Promise<InvoiceItem[]> {
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
      
      return (data as any[]).map(this.mapInvoiceItemFromDB);
    } catch (error) {
      console.error('Error adding items to invoice:', error);
      throw error;
    }
  }

  async updateItemInInvoice(id: string, item: Partial<Omit<InvoiceItem, 'id'>>): Promise<InvoiceItem> {
    try {
      const updateData: any = {};
      
      if (item.description !== undefined) updateData.description = item.description;
      if (item.quantity !== undefined) updateData.quantity = item.quantity;
      if (item.unitPrice !== undefined) updateData.unit_price = item.unitPrice;
      if (item.taxRate !== undefined) updateData.tax_rate = item.taxRate;
      if (item.amount !== undefined) updateData.amount = item.amount;
      if (item.accountId !== undefined) updateData.account_id = item.accountId;
      
      const { data, error } = await this.supabase
        .from('invoice_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapInvoiceItemFromDB(data);
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
  
  private mapInvoiceFromDB(invoice: any, items: any[]): Invoice {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.contact_id,
      customerName: invoice.contact_name || '',
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      status: invoice.status,
      notes: invoice.notes || '',
      items: items.map(this.mapInvoiceItemFromDB),
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    };
  }
  
  private mapInvoiceItemFromDB(item: any): InvoiceItem {
    return {
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate,
      amount: item.amount,
      accountId: item.account_id || ''
    };
  }
}
