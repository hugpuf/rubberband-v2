import { Invoice } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { mapInvoiceFromApi, mapInvoiceToApiFormat } from "../utils/mappers";

/**
 * Interface defining the standard operations for invoices
 * This abstraction will allow us to swap implementations (native, Xero, etc.)
 */
export interface IInvoiceService {
  createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { organization_id: string }): Promise<Invoice>;
  getInvoices(options?: { filter?: string; sort?: string; page?: number; limit?: number }): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<boolean>;
}

/**
 * Native implementation of the InvoiceService interface that uses Supabase
 * This implementation will be used when no external integrations are configured
 */
export class SupabaseInvoiceService implements IInvoiceService {
  /**
   * Creates a new invoice in the database
   */
  async createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { organization_id: string }): Promise<Invoice> {
    try {
      console.log('Creating invoice with data:', invoice);
      
      // Map invoice to database format
      const invoiceData = {
        ...mapInvoiceToApiFormat(invoice),
        organization_id: invoice.organization_id,
        contact_type: 'customer'
      };

      // Check for null values in required fields
      const requiredFields = ['organization_id', 'contact_type', 'status', 'issue_date', 'due_date'];
      const missingFields = requiredFields.filter(field => invoiceData[field] === null || invoiceData[field] === undefined);
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Insert invoice
      const { data: insertedInvoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error inserting invoice:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        throw error;
      }
      
      if (!insertedInvoice) {
        throw new Error('Failed to insert invoice - no data returned');
      }
      
      // Insert invoice items
      if (invoice.items && invoice.items.length > 0) {
        const invoiceItems = invoice.items.map(item => ({
          invoice_id: insertedInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          amount: item.amount,
          account_id: item.accountId
        }));

        console.log('Invoice items data:', invoiceItems);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) {
          console.error('Error inserting invoice items:', itemsError);
          console.error('Error details:', itemsError.details, itemsError.hint, itemsError.message);
          throw itemsError;
        }
      }

      // Fetch the inserted invoice with its items
      const { data: invoiceWithItems, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', insertedInvoice.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching invoice with items:', fetchError);
        throw fetchError;
      }
      
      if (!invoiceWithItems) {
        throw new Error('Failed to fetch invoice with items');
      }

      return mapInvoiceFromApi(invoiceWithItems);
    } catch (error) {
      console.error(`Error creating invoice:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all invoices with optional filtering, sorting and pagination
   */
  async getInvoices(options?: { 
    filter?: string; 
    sort?: string; 
    page?: number; 
    limit?: number 
  }): Promise<Invoice[]> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `);
      
      // Apply filtering if provided
      if (options?.filter) {
        // Example: status=draft or customer=xyz
        const [field, value] = options.filter.split('=');
        if (field && value) {
          query = query.eq(field, value);
        }
      }
      
      // Apply sorting if provided
      if (options?.sort) {
        // Example: created_at.desc or due_date.asc
        const [field, direction] = options.sort.split('.');
        if (field) {
          const isAsc = direction !== 'desc';
          query = query.order(field, { ascending: isAsc });
        }
      } else {
        // Default sorting by created_at, descending
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination if provided
      if (options?.page !== undefined && options?.limit !== undefined) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      // FIX: Use type casting instead of type assertion to avoid deep instantiation issues
      const typedData = (data || []) as any[];
      return typedData.map(item => mapInvoiceFromApi(item));
    } catch (error) {
      console.error('Error in getInvoices:', error);
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  /**
   * Retrieves a single invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        throw error;
      }

      if (!data) return null;
      return mapInvoiceFromApi(data);
    } catch (error) {
      console.error(`Error in getInvoiceById for ${id}:`, error);
      return null;
    }
  }

  /**
   * Updates an existing invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      // Convert updates to database format
      const updateData: any = {};
      if (updates.customerName !== undefined) updateData.contact_name = updates.customerName;
      if (updates.customerId !== undefined) updateData.contact_id = updates.customerId;
      if (updates.invoiceNumber !== undefined) updateData.invoice_number = updates.invoiceNumber;
      if (updates.issueDate !== undefined) updateData.issue_date = updates.issueDate;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
      if (updates.total !== undefined) updateData.total = updates.total;
      
      updateData.updated_at = new Date().toISOString();

      // Update the invoice
      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!updatedInvoice) throw new Error(`Invoice with id ${id} not found`);

      // If there are items to update
      if (updates.items && updates.items.length > 0) {
        // First, delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        if (deleteError) throw deleteError;

        // Then insert new items
        const invoiceItems = updates.items.map(item => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          amount: item.amount,
          account_id: item.accountId
        }));

        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (insertError) throw insertError;
      }

      // Fetch the updated invoice with its items
      const { data: invoiceWithItems, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!invoiceWithItems) throw new Error(`Could not fetch updated invoice with id ${id}`);

      return mapInvoiceFromApi(invoiceWithItems);
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an invoice and its items
   */
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      // Delete invoice items first (should cascade, but just to be safe)
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  }
}

// Default export of the native implementation
export default new SupabaseInvoiceService();
