
import { supabase } from "@/integrations/supabase/client";
import { 
  PayrollRun, 
  PayrollItem, 
  CreatePayrollRunParams, 
  UpdatePayrollRunParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollRunFilterParams,
  PayrollItemFilterParams,
  PaginatedResponse,
  TaxCalculationResult
} from "../../types";
import { IPayrollService } from "./PayrollServiceInterface";
import { mapPayrollRunFromApi, mapPayrollRunToApiFormat, mapPayrollItemFromApi, mapPayrollItemToApiFormat } from "../../utils/payrollMappers";

/**
 * Native implementation of the PayrollService interface that uses Supabase
 * This implementation will be used when no external integrations are configured
 */
export class SupabasePayrollService implements IPayrollService {
  /**
   * Creates a new payroll run
   */
  async createPayrollRun(params: CreatePayrollRunParams & { organization_id: string }): Promise<PayrollRun> {
    try {
      console.log('Creating payroll run with data:', params);
      
      // Map payroll run to database format
      const payrollRunData = {
        ...mapPayrollRunToApiFormat(params),
        organization_id: params.organization_id,
        status: params.status || 'draft',
        employee_count: 0,
        gross_amount: 0,
        tax_amount: 0,
        deduction_amount: 0,
        net_amount: 0
      };

      // Check for null values in required fields
      const requiredFields = ['organization_id', 'name', 'period_start', 'period_end', 'payment_date', 'status'];
      const missingFields = requiredFields.filter(field => payrollRunData[field] === null || payrollRunData[field] === undefined);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Insert payroll run
      const { data: insertedPayrollRun, error } = await supabase
        .from('payroll_runs')
        .insert(payrollRunData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error inserting payroll run:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        throw error;
      }
      
      if (!insertedPayrollRun) {
        throw new Error('Failed to insert payroll run - no data returned');
      }

      // Pre-create payroll items for selected employees if provided
      if (params.employeeIds && params.employeeIds.length > 0) {
        // Fetch employee data
        const { data: employees, error: employeesError } = await supabase
          .from('contacts')
          .select('id, name')
          .eq('type', 'employee')
          .in('id', params.employeeIds);
          
        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          // We don't throw here, just log the error and continue
        }
        
        if (employees && employees.length > 0) {
          // Create payroll items for each employee
          const payrollItems = employees.map(employee => ({
            payroll_run_id: insertedPayrollRun.id,
            contact_id: employee.id,
            contact_type: 'employee',
            gross_salary: 0,
            tax_amount: 0,
            deduction_amount: 0,
            net_salary: 0,
            status: 'pending'
          }));

          const { error: itemsError } = await supabase
            .from('payroll_items')
            .insert(payrollItems);

          if (itemsError) {
            console.error('Error inserting payroll items:', itemsError);
            // We don't throw here, just log the error and continue
          }
          
          // Update employee count
          const { error: updateError } = await supabase
            .from('payroll_runs')
            .update({ employee_count: employees.length })
            .eq('id', insertedPayrollRun.id);
            
          if (updateError) {
            console.error('Error updating employee count:', updateError);
          }
        }
      }
      
      return mapPayrollRunFromApi(insertedPayrollRun);
    } catch (error) {
      console.error(`Error creating payroll run:`, error);
      throw error;
    }
  }

  /**
   * Retrieves payroll runs with pagination and filtering
   */
  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = supabase
        .from('payroll_runs')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.startDate) {
        query = query.gte('period_start', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('period_end', filters.endDate);
      }
      
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      // Apply sorting
      query = query.order('period_start', { ascending: false });
      
      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const startIndex = (page - 1) * limit;
      
      query = query.range(startIndex, startIndex + limit - 1);
      
      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching payroll runs:', error);
        throw error;
      }
      
      const runs = (data || []).map((item: any) => mapPayrollRunFromApi(item));
      
      return {
        data: runs,
        total: count || runs.length,
        page,
        limit,
        hasMore: count ? startIndex + limit < count : false
      };
    } catch (error) {
      console.error('Error in getPayrollRuns:', error);
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        hasMore: false
      };
    }
  }

  /**
   * Retrieves a single payroll run by ID
   */
  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching payroll run ${id}:`, error);
        throw error;
      }

      if (!data) return null;
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error(`Error in getPayrollRunById for ${id}:`, error);
      return null;
    }
  }

  /**
   * Updates an existing payroll run
   */
  async updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> {
    try {
      // Convert updates to database format
      const updateData = mapPayrollRunToApiFormat(updates as any);
      updateData.updated_at = new Date().toISOString();

      // Update the payroll run
      const { data: updatedRun, error } = await supabase
        .from('payroll_runs')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`Error updating payroll run ${id}:`, error);
        throw error;
      }

      if (!updatedRun) {
        throw new Error(`Payroll run with id ${id} not found`);
      }

      return mapPayrollRunFromApi(updatedRun);
    } catch (error) {
      console.error(`Error updating payroll run ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a payroll run and its items
   */
  async deletePayrollRun(id: string): Promise<boolean> {
    try {
      // First check if payroll run is in a deletable state
      const { data: run, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('status')
        .eq('id', id)
        .maybeSingle();
        
      if (fetchError) {
        console.error(`Error fetching payroll run status ${id}:`, fetchError);
        throw fetchError;
      }
      
      if (!run) {
        throw new Error(`Payroll run with id ${id} not found`);
      }
      
      if (run.status === 'completed') {
        throw new Error('Cannot delete a completed payroll run');
      }
      
      // Delete payroll items first
      const { error: itemsError } = await supabase
        .from('payroll_items')
        .delete()
        .eq('payroll_run_id', id);

      if (itemsError) {
        console.error(`Error deleting payroll items for run ${id}:`, itemsError);
        throw itemsError;
      }

      // Delete the payroll run
      const { error } = await supabase
        .from('payroll_runs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting payroll run ${id}:`, error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Error deleting payroll run ${id}:`, error);
      throw error;
    }
  }

  /**
   * Processes a payroll run, calculating all payroll items
   */
  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Update status to processing
      const { data: run, error: updateError } = await supabase
        .from('payroll_runs')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
        
      if (updateError) {
        console.error(`Error updating payroll run status ${id}:`, updateError);
        throw updateError;
      }
      
      if (!run) {
        throw new Error(`Payroll run with id ${id} not found`);
      }
      
      // Get all payroll items for this run
      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', id);
        
      if (itemsError) {
        console.error(`Error fetching payroll items for run ${id}:`, itemsError);
        throw itemsError;
      }
      
      if (!items || items.length === 0) {
        // No items to process
        return mapPayrollRunFromApi(run);
      }
      
      // Calculate totals
      let grossAmount = 0;
      let taxAmount = 0;
      let deductionAmount = 0;
      let netAmount = 0;
      
      // Process each item
      for (const item of items) {
        try {
          // In a real implementation, this would calculate taxes based on configurations
          // For this example, we'll use a simple calculation
          const calculatedTaxes = await this.calculateTaxes(item.gross_salary, item.contact_id);
          
          const updatedItem = {
            tax_amount: calculatedTaxes.totalTax,
            deduction_amount: item.deduction_amount || 0,
            net_salary: item.gross_salary - calculatedTaxes.totalTax - (item.deduction_amount || 0),
            status: 'processed',
            updated_at: new Date().toISOString()
          };
          
          // Update the item
          await supabase
            .from('payroll_items')
            .update(updatedItem)
            .eq('id', item.id);
            
          // Add to totals
          grossAmount += item.gross_salary;
          taxAmount += updatedItem.tax_amount;
          deductionAmount += updatedItem.deduction_amount;
          netAmount += updatedItem.net_salary;
        } catch (err) {
          console.error(`Error processing payroll item ${item.id}:`, err);
          // Update item status to error
          await supabase
            .from('payroll_items')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', item.id);
        }
      }
      
      // Update payroll run with calculated totals
      const { data: updatedRun, error: runUpdateError } = await supabase
        .from('payroll_runs')
        .update({
          gross_amount: grossAmount,
          tax_amount: taxAmount,
          deduction_amount: deductionAmount,
          net_amount: netAmount,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();
        
      if (runUpdateError) {
        console.error(`Error updating payroll run totals ${id}:`, runUpdateError);
        throw runUpdateError;
      }
      
      return mapPayrollRunFromApi(updatedRun);
    } catch (error) {
      console.error(`Error processing payroll run ${id}:`, error);
      
      // Update status to error
      await supabase
        .from('payroll_runs')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', id);
        
      throw error;
    }
  }

  /**
   * Finalizes a payroll run, marking it as completed
   */
  async finalizePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Update status to completed
      const { data: run, error } = await supabase
        .from('payroll_runs')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
        
      if (error) {
        console.error(`Error finalizing payroll run ${id}:`, error);
        throw error;
      }
      
      if (!run) {
        throw new Error(`Payroll run with id ${id} not found`);
      }
      
      return mapPayrollRunFromApi(run);
    } catch (error) {
      console.error(`Error finalizing payroll run ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new payroll item
   */
  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    try {
      // Map payroll item to database format
      const payrollItemData = mapPayrollItemToApiFormat(params);
      
      // Insert payroll item
      const { data: insertedItem, error } = await supabase
        .from('payroll_items')
        .insert(payrollItemData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error inserting payroll item:', error);
        throw error;
      }
      
      if (!insertedItem) {
        throw new Error('Failed to insert payroll item - no data returned');
      }
      
      return mapPayrollItemFromApi(insertedItem);
    } catch (error) {
      console.error(`Error creating payroll item:`, error);
      throw error;
    }
  }

  /**
   * Retrieves payroll items with pagination and filtering
   */
  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    try {
      let query = supabase
        .from('payroll_items')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters?.payrollRunId) {
        query = query.eq('payroll_run_id', filters.payrollRunId);
      }
      
      if (filters?.employeeId) {
        query = query.eq('contact_id', filters.employeeId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      // Apply sorting
      query = query.order('created_at', { ascending: false });
      
      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const startIndex = (page - 1) * limit;
      
      query = query.range(startIndex, startIndex + limit - 1);
      
      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching payroll items:', error);
        throw error;
      }
      
      const items = (data || []).map((item: any) => mapPayrollItemFromApi(item));
      
      return {
        data: items,
        total: count || items.length,
        page,
        limit,
        hasMore: count ? startIndex + limit < count : false
      };
    } catch (error) {
      console.error('Error in getPayrollItems:', error);
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        hasMore: false
      };
    }
  }

  /**
   * Retrieves a single payroll item by ID
   */
  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching payroll item ${id}:`, error);
        throw error;
      }

      if (!data) return null;
      return mapPayrollItemFromApi(data);
    } catch (error) {
      console.error(`Error in getPayrollItemById for ${id}:`, error);
      return null;
    }
  }

  /**
   * Retrieves all payroll items for a payroll run
   */
  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', runId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching payroll items for run ${runId}:`, error);
        throw error;
      }

      return (data || []).map((item: any) => mapPayrollItemFromApi(item));
    } catch (error) {
      console.error(`Error in getPayrollItemsByRunId for ${runId}:`, error);
      return [];
    }
  }

  /**
   * Updates an existing payroll item
   */
  async updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> {
    try {
      // Convert updates to database format
      const updateData = mapPayrollItemToApiFormat(updates as any);
      updateData.updated_at = new Date().toISOString();

      // Update the payroll item
      const { data: updatedItem, error } = await supabase
        .from('payroll_items')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`Error updating payroll item ${id}:`, error);
        throw error;
      }

      if (!updatedItem) {
        throw new Error(`Payroll item with id ${id} not found`);
      }
      
      // If gross salary was updated, recalculate taxes and net salary
      if (updates.grossSalary !== undefined) {
        await this.recalculatePayrollItem(id);
        
        // Fetch the updated item
        const { data: recalculatedItem, error: fetchError } = await supabase
          .from('payroll_items')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (fetchError) {
          console.error(`Error fetching recalculated payroll item ${id}:`, fetchError);
          throw fetchError;
        }
        
        if (!recalculatedItem) {
          throw new Error(`Recalculated payroll item with id ${id} not found`);
        }
        
        return mapPayrollItemFromApi(recalculatedItem);
      }

      return mapPayrollItemFromApi(updatedItem);
    } catch (error) {
      console.error(`Error updating payroll item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a payroll item
   */
  async deletePayrollItem(id: string): Promise<boolean> {
    try {
      // First fetch the item to get the payroll run ID
      const { data: item, error: fetchError } = await supabase
        .from('payroll_items')
        .select('payroll_run_id')
        .eq('id', id)
        .maybeSingle();
        
      if (fetchError) {
        console.error(`Error fetching payroll item ${id}:`, fetchError);
        throw fetchError;
      }
      
      if (!item) {
        throw new Error(`Payroll item with id ${id} not found`);
      }
      
      // Delete the payroll item
      const { error } = await supabase
        .from('payroll_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting payroll item ${id}:`, error);
        throw error;
      }
      
      // Update the payroll run (employee count, totals, etc.)
      await this.recalculatePayrollRun(item.payroll_run_id);

      return true;
    } catch (error) {
      console.error(`Error deleting payroll item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculates taxes for a given gross amount and employee
   */
  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    // In a real implementation, this would calculate taxes based on tax tables, employee information, etc.
    // For this example, we'll use a simple calculation
    
    // Default tax rates
    const federalTaxRate = 0.15;
    const stateTaxRate = 0.05;
    const localTaxRate = 0.01;
    const medicareTaxRate = 0.0145;
    const socialSecurityTaxRate = 0.062;
    
    // Calculate taxes
    const federalTax = grossAmount * federalTaxRate;
    const stateTax = grossAmount * stateTaxRate;
    const localTax = grossAmount * localTaxRate;
    const medicareTax = grossAmount * medicareTaxRate;
    const socialSecurityTax = grossAmount * socialSecurityTaxRate;
    
    const totalTax = federalTax + stateTax + localTax + medicareTax + socialSecurityTax;
    
    return {
      federalTax,
      stateTax,
      localTax,
      medicareTax,
      socialSecurityTax,
      totalTax
    };
  }

  /**
   * Recalculates a payroll item (taxes, deductions, net salary)
   */
  async recalculatePayrollItem(id: string): Promise<PayrollItem> {
    try {
      // Fetch the payroll item
      const { data: item, error: fetchError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (fetchError) {
        console.error(`Error fetching payroll item ${id}:`, fetchError);
        throw fetchError;
      }
      
      if (!item) {
        throw new Error(`Payroll item with id ${id} not found`);
      }
      
      // Calculate taxes
      const calculatedTaxes = await this.calculateTaxes(item.gross_salary, item.contact_id);
      
      // Update the item
      const { data: updatedItem, error: updateError } = await supabase
        .from('payroll_items')
        .update({
          tax_amount: calculatedTaxes.totalTax,
          net_salary: item.gross_salary - calculatedTaxes.totalTax - item.deduction_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();
        
      if (updateError) {
        console.error(`Error updating payroll item ${id}:`, updateError);
        throw updateError;
      }
      
      if (!updatedItem) {
        throw new Error(`Updated payroll item with id ${id} not found`);
      }
      
      return mapPayrollItemFromApi(updatedItem);
    } catch (error) {
      console.error(`Error recalculating payroll item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recalculates a payroll run (totals)
   */
  async recalculatePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Fetch all payroll items for this run
      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', id);
        
      if (itemsError) {
        console.error(`Error fetching payroll items for run ${id}:`, itemsError);
        throw itemsError;
      }
      
      // Calculate totals
      let grossAmount = 0;
      let taxAmount = 0;
      let deductionAmount = 0;
      let netAmount = 0;
      const employeeCount = items ? items.length : 0;
      
      if (items && items.length > 0) {
        for (const item of items) {
          grossAmount += item.gross_salary || 0;
          taxAmount += item.tax_amount || 0;
          deductionAmount += item.deduction_amount || 0;
          netAmount += item.net_salary || 0;
        }
      }
      
      // Update the payroll run
      const { data: updatedRun, error: updateError } = await supabase
        .from('payroll_runs')
        .update({
          employee_count: employeeCount,
          gross_amount: grossAmount,
          tax_amount: taxAmount,
          deduction_amount: deductionAmount,
          net_amount: netAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();
        
      if (updateError) {
        console.error(`Error updating payroll run ${id}:`, updateError);
        throw updateError;
      }
      
      if (!updatedRun) {
        throw new Error(`Payroll run with id ${id} not found`);
      }
      
      return mapPayrollRunFromApi(updatedRun);
    } catch (error) {
      console.error(`Error recalculating payroll run ${id}:`, error);
      throw error;
    }
  }

  /**
   * Exports a payroll run in the specified format
   */
  async exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> {
    try {
      // Fetch the payroll run
      const payrollRun = await this.getPayrollRunById(id);
      if (!payrollRun) {
        throw new Error(`Payroll run with id ${id} not found`);
      }
      
      // Fetch all payroll items for this run
      const payrollItems = await this.getPayrollItemsByRunId(id);
      
      // Create export data
      const exportData = {
        payrollRun,
        payrollItems
      };
      
      // In a real implementation, this would generate the requested format
      // For this example, we'll just return a JSON string
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`Error exporting payroll run ${id}:`, error);
      throw error;
    }
  }

  /**
   * Imports payroll items for a payroll run
   */
  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    try {
      // Verify the payroll run exists
      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .select('id, status')
        .eq('id', runId)
        .maybeSingle();
        
      if (runError) {
        console.error(`Error fetching payroll run ${runId}:`, runError);
        throw runError;
      }
      
      if (!run) {
        throw new Error(`Payroll run with id ${runId} not found`);
      }
      
      if (run.status !== 'draft') {
        throw new Error(`Cannot import items for payroll run in ${run.status} status`);
      }
      
      // Process import data
      const errors: any[] = [];
      let imported = 0;
      
      for (const item of data) {
        try {
          // Format the item data
          const itemData = {
            payroll_run_id: runId,
            contact_id: item.employeeId,
            contact_type: 'employee',
            gross_salary: parseFloat(item.grossSalary) || 0,
            tax_amount: parseFloat(item.taxAmount) || 0,
            deduction_amount: parseFloat(item.deductionAmount) || 0,
            net_salary: parseFloat(item.netSalary) || 0,
            notes: item.notes || '',
            status: 'pending'
          };
          
          // Insert the item
          const { error: insertError } = await supabase
            .from('payroll_items')
            .insert(itemData);
            
          if (insertError) {
            errors.push({
              item,
              error: insertError.message
            });
          } else {
            imported++;
          }
        } catch (err) {
          errors.push({
            item,
            error: err.message
          });
        }
      }
      
      // Update the payroll run
      await this.recalculatePayrollRun(runId);
      
      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      console.error(`Error importing payroll items for run ${runId}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance of the service
const payrollService = new SupabasePayrollService();

// Default export of the native implementation
export default payrollService;
