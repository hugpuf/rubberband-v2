
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { Bill, BillItem } from "../types";

export class BillService {
  private supabase: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.supabase = client;
  }

  async createBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }): Promise<Bill> {
    try {
      // Map bill to database format
      const billData = {
        organization_id: bill.organization_id,
        contact_id: bill.vendorId,
        contact_type: 'vendor',
        bill_number: bill.billNumber || null,
        issue_date: bill.issueDate,
        due_date: bill.dueDate,
        subtotal: bill.subtotal,
        tax_amount: bill.taxAmount,
        total: bill.total,
        status: bill.status,
        notes: bill.notes,
      };

      // Insert bill
      const { data: insertedBill, error } = await this.supabase
        .from('bills')
        .insert(billData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting bill:', error);
        throw error;
      }

      // Insert bill items
      if (bill.items && bill.items.length > 0) {
        const billItems = bill.items.map(item => ({
          bill_id: insertedBill.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          amount: item.amount,
          account_id: item.accountId
        }));

        const { error: itemsError } = await this.supabase
          .from('bill_items')
          .insert(billItems);

        if (itemsError) {
          console.error('Error inserting bill items:', itemsError);
          throw itemsError;
        }
      }

      // Fetch the inserted bill with its items
      const { data: billWithItems, error: fetchError } = await this.supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(*)
        `)
        .eq('id', insertedBill.id)
        .single();

      if (fetchError) {
        console.error('Error fetching bill with items:', fetchError);
        throw fetchError;
      }

      return this.mapBillFromApi(billWithItems);
    } catch (error) {
      console.error(`Error creating bill:`, error);
      throw error;
    }
  }

  async getBills(): Promise<Bill[]> {
    try {
      const { data, error } = await this.supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as any[]).map(this.mapBillFromApi);
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async getBillById(id: string): Promise<Bill | null> {
    try {
      const { data, error } = await this.supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return this.mapBillFromApi(data);
    } catch (error) {
      console.error(`Error fetching bill ${id}:`, error);
      return null;
    }
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill> {
    try {
      // Convert updates to database format
      const updateData: any = {};
      if (updates.vendorName !== undefined) updateData.contact_name = updates.vendorName;
      if (updates.vendorId !== undefined) updateData.contact_id = updates.vendorId;
      if (updates.billNumber !== undefined) updateData.bill_number = updates.billNumber;
      if (updates.issueDate !== undefined) updateData.issue_date = updates.issueDate;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
      if (updates.total !== undefined) updateData.total = updates.total;
      
      updateData.updated_at = new Date().toISOString();

      // Update the bill
      const { data: updatedBill, error } = await this.supabase
        .from('bills')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // If there are items to update
      if (updates.items && updates.items.length > 0) {
        // First, delete existing items
        const { error: deleteError } = await this.supabase
          .from('bill_items')
          .delete()
          .eq('bill_id', id);

        if (deleteError) throw deleteError;

        // Then insert new items
        const billItems = updates.items.map(item => ({
          bill_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          amount: item.amount,
          account_id: item.accountId
        }));

        const { error: insertError } = await this.supabase
          .from('bill_items')
          .insert(billItems);

        if (insertError) throw insertError;
      }

      // Fetch the updated bill with its items
      const { data: billWithItems, error: fetchError } = await this.supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return this.mapBillFromApi(billWithItems);
    } catch (error) {
      console.error(`Error updating bill ${id}:`, error);
      throw error;
    }
  }

  async deleteBill(id: string): Promise<boolean> {
    try {
      // Delete bill items first (should cascade, but just to be safe)
      const { error: itemsError } = await this.supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', id);

      if (itemsError) throw itemsError;

      // Delete the bill
      const { error } = await this.supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting bill ${id}:`, error);
      throw error;
    }
  }

  private mapBillFromApi(data: any): Bill {
    const items = data.items ? data.items.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate,
      amount: item.amount,
      accountId: item.account_id
    })) : [];

    return {
      id: data.id,
      billNumber: data.bill_number,
      vendorId: data.contact_id,
      vendorName: data.contact_name || '',
      issueDate: data.issue_date,
      dueDate: data.due_date,
      subtotal: data.subtotal,
      taxAmount: data.tax_amount,
      total: data.total,
      status: data.status,
      notes: data.notes,
      items,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  mapBillToApiFormat(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      contact_id: bill.vendorId,
      contact_name: bill.vendorName,
      contact_type: 'vendor',
      bill_number: bill.billNumber,
      issue_date: bill.issueDate,
      due_date: bill.dueDate,
      subtotal: bill.subtotal,
      tax_amount: bill.taxAmount,
      total: bill.total,
      status: bill.status,
      notes: bill.notes
    };
  }
}
