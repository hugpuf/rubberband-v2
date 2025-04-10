
import { supabase } from "@/integrations/supabase/client";
import { IPayrollService } from "./PayrollServiceInterface";
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
} from "../../types/payroll";
import { mapPayrollRunFromApi, mapPayrollRunToApiFormat, mapPayrollItemFromApi, mapPayrollItemToApiFormat } from "../../utils/payrollMappers";

class SupabasePayrollService implements IPayrollService {
  
  // Payroll Run operations
  async createPayrollRun(params: CreatePayrollRunParams & { organization_id: string }): Promise<PayrollRun> {
    try {
      const { organization_id, ...rest } = params;
      
      const formattedData = {
        organization_id,
        ...mapPayrollRunToApiFormat(rest),
        status: rest.status || 'draft',
        employee_count: 0, // Will be updated as employees are added
        gross_amount: 0,
        tax_amount: 0,
        deduction_amount: 0,
        net_amount: 0
      };
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .insert(formattedData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error("Error creating payroll run:", error);
      throw error;
    }
  }
  
  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = supabase
        .from('payroll_runs')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.startDate) {
          query = query.gte('period_start', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('period_end', filters.endDate);
        }
        
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
        
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        query = query.range(from, to);
      }
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      const totalCount = count || 0;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      
      // Cast to any[] before mapping to avoid "Type instantiation is excessively deep" errors
      const mappedData = (data as any[]).map(mapPayrollRunFromApi);
      
      return {
        data: mappedData,
        total: totalCount,
        page,
        limit,
        hasMore: totalCount > page * limit
      };
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      throw error;
    }
  }
  
  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      throw error;
    }
  }
  
  async updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> {
    try {
      const formattedData = mapPayrollRunToApiFormat(updates);
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .update(formattedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error("Error updating payroll run:", error);
      throw error;
    }
  }
  
  async deletePayrollRun(id: string): Promise<boolean> {
    try {
      // Check if payroll run is in 'draft' status
      const { data: payrollRun, error: checkError } = await supabase
        .from('payroll_runs')
        .select('status')
        .eq('id', id)
        .single();
      
      if (checkError) {
        throw checkError;
      }
      
      if (payrollRun.status !== 'draft') {
        throw new Error("Only draft payroll runs can be deleted");
      }
      
      // Delete all payroll items first
      const { error: itemsError } = await supabase
        .from('payroll_items')
        .delete()
        .eq('payroll_run_id', id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Delete the payroll run
      const { error } = await supabase
        .from('payroll_runs')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting payroll run:", error);
      throw error;
    }
  }
  
  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Update the run status to processing
      const { data: updatedRun, error: updateError } = await supabase
        .from('payroll_runs')
        .update({ status: 'processing' })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      // Get all payroll items for this run
      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Process each item (calculate taxes, deductions, etc.)
      let totalGross = 0;
      let totalTax = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      
      for (const item of items || []) {
        const processedItem = await this.recalculatePayrollItem(item.id);
        
        totalGross += processedItem.grossSalary;
        totalTax += processedItem.taxAmount;
        totalDeductions += processedItem.deductionAmount;
        totalNet += processedItem.netSalary;
      }
      
      // Update the run with calculated totals
      const { data: finalRun, error: finalError } = await supabase
        .from('payroll_runs')
        .update({
          gross_amount: totalGross,
          tax_amount: totalTax,
          deduction_amount: totalDeductions,
          net_amount: totalNet,
          employee_count: items?.length || 0
        })
        .eq('id', id)
        .select()
        .single();
      
      if (finalError) {
        throw finalError;
      }
      
      return mapPayrollRunFromApi(finalRun);
    } catch (error) {
      console.error("Error processing payroll run:", error);
      
      // Set status to error
      await supabase
        .from('payroll_runs')
        .update({
          status: 'error',
          processing_errors: [error.message]
        })
        .eq('id', id);
      
      throw error;
    }
  }
  
  async finalizePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Check if all items are processed
      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('status')
        .eq('payroll_run_id', id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      const hasUnprocessedItems = items?.some(item => item.status !== 'processed');
      
      if (hasUnprocessedItems) {
        throw new Error("Cannot finalize payroll run with unprocessed items");
      }
      
      // Update the run status to completed
      const { data, error } = await supabase
        .from('payroll_runs')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error("Error finalizing payroll run:", error);
      throw error;
    }
  }
  
  // Payroll Item operations
  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    try {
      const formattedData = mapPayrollItemToApiFormat(params);
      
      // Calculate net salary if not provided
      if (!formattedData.net_salary) {
        formattedData.net_salary = (formattedData.gross_salary || 0) - 
                                  (formattedData.tax_amount || 0) - 
                                  (formattedData.deduction_amount || 0);
      }
      
      const { data, error } = await supabase
        .from('payroll_items')
        .insert(formattedData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the employee count on the payroll run
      const { data: payrollRun, error: countError } = await supabase
        .from('payroll_runs')
        .select('employee_count')
        .eq('id', params.payrollRunId)
        .single();
      
      if (!countError) {
        await supabase
          .from('payroll_runs')
          .update({
            employee_count: (payrollRun.employee_count || 0) + 1
          })
          .eq('id', params.payrollRunId);
      }
      
      return mapPayrollItemFromApi(data);
    } catch (error) {
      console.error("Error creating payroll item:", error);
      throw error;
    }
  }
  
  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    try {
      let query = supabase
        .from('payroll_items')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters) {
        if (filters.payrollRunId) {
          query = query.eq('payroll_run_id', filters.payrollRunId);
        }
        
        if (filters.employeeId) {
          query = query.eq('contact_id', filters.employeeId);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.search) {
          query = query.or(`employee_name.ilike.%${filters.search}%`);
        }
        
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        query = query.range(from, to);
      }
      
      // Order by created_at
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      const totalCount = count || 0;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      
      // Cast to any[] before mapping to avoid "Type instantiation is excessively deep" errors
      const mappedData = (data as any[]).map(mapPayrollItemFromApi);
      
      return {
        data: mappedData,
        total: totalCount,
        page,
        limit,
        hasMore: totalCount > page * limit
      };
    } catch (error) {
      console.error("Error fetching payroll items:", error);
      throw error;
    }
  }
  
  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      return mapPayrollItemFromApi(data);
    } catch (error) {
      console.error("Error fetching payroll item:", error);
      throw error;
    }
  }
  
  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', runId);
      
      if (error) {
        throw error;
      }
      
      // Cast to any[] before mapping to avoid "Type instantiation is excessively deep" errors
      return (data as any[]).map(mapPayrollItemFromApi);
    } catch (error) {
      console.error("Error fetching payroll items by run ID:", error);
      throw error;
    }
  }
  
  async updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> {
    try {
      const formattedData = mapPayrollItemToApiFormat(updates);
      
      const { data, error } = await supabase
        .from('payroll_items')
        .update(formattedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollItemFromApi(data);
    } catch (error) {
      console.error("Error updating payroll item:", error);
      throw error;
    }
  }
  
  async deletePayrollItem(id: string): Promise<boolean> {
    try {
      // Get the item to find the payroll run
      const { data: item, error: getError } = await supabase
        .from('payroll_items')
        .select('payroll_run_id')
        .eq('id', id)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      // Check if payroll run is in 'draft' status
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .select('status, employee_count')
        .eq('id', item.payroll_run_id)
        .single();
      
      if (runError) {
        throw runError;
      }
      
      if (payrollRun.status !== 'draft') {
        throw new Error("Cannot delete items from a payroll run that is not in draft status");
      }
      
      // Delete the item
      const { error } = await supabase
        .from('payroll_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update the employee count on the payroll run
      await supabase
        .from('payroll_runs')
        .update({
          employee_count: Math.max((payrollRun.employee_count || 1) - 1, 0)
        })
        .eq('id', item.payroll_run_id);
      
      return true;
    } catch (error) {
      console.error("Error deleting payroll item:", error);
      throw error;
    }
  }
  
  // Tax and calculation operations
  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    // Simplified tax calculation - in a real app, this would use tax tables, employee location, etc.
    const federalTaxRate = 0.15;  // 15%
    const stateTaxRate = 0.05;    // 5%
    const localTaxRate = 0.01;    // 1%
    const medicareTaxRate = 0.0145; // 1.45%
    const socialSecurityTaxRate = 0.062; // 6.2%
    
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
  
  async recalculatePayrollItem(id: string): Promise<PayrollItem> {
    try {
      // Get the current payroll item
      const { data: item, error: getError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      // Calculate taxes
      const taxes = await this.calculateTaxes(item.gross_salary, item.contact_id);
      
      // Calculate net salary
      const netSalary = item.gross_salary - taxes.totalTax - (item.deduction_amount || 0);
      
      // Update the item
      const { data, error } = await supabase
        .from('payroll_items')
        .update({
          tax_amount: taxes.totalTax,
          net_salary: netSalary,
          status: 'processed'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollItemFromApi(data);
    } catch (error) {
      console.error("Error recalculating payroll item:", error);
      
      // Mark item as error
      await supabase
        .from('payroll_items')
        .update({
          status: 'error'
        })
        .eq('id', id);
      
      throw error;
    }
  }
  
  async recalculatePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Get all items for this run
      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Recalculate each item
      for (const item of items || []) {
        await this.recalculatePayrollItem(item.id);
      }
      
      // Get updated items to calculate totals
      const { data: updatedItems, error: updatedError } = await supabase
        .from('payroll_items')
        .select('gross_salary, tax_amount, deduction_amount, net_salary')
        .eq('payroll_run_id', id);
      
      if (updatedError) {
        throw updatedError;
      }
      
      // Calculate totals
      let grossAmount = 0;
      let taxAmount = 0;
      let deductionAmount = 0;
      let netAmount = 0;
      
      for (const item of updatedItems || []) {
        grossAmount += item.gross_salary || 0;
        taxAmount += item.tax_amount || 0;
        deductionAmount += item.deduction_amount || 0;
        netAmount += item.net_salary || 0;
      }
      
      // Update the run
      const { data, error } = await supabase
        .from('payroll_runs')
        .update({
          gross_amount: grossAmount,
          tax_amount: taxAmount,
          deduction_amount: deductionAmount,
          net_amount: netAmount,
          employee_count: items?.length || 0,
          status: 'processing'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return mapPayrollRunFromApi(data);
    } catch (error) {
      console.error("Error recalculating payroll run:", error);
      
      // Set status to error
      await supabase
        .from('payroll_runs')
        .update({
          status: 'error',
          processing_errors: [error.message]
        })
        .eq('id', id);
      
      throw error;
    }
  }
  
  // Import/Export operations
  async exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> {
    try {
      // Get the payroll run
      const run = await this.getPayrollRunById(id);
      if (!run) {
        throw new Error("Payroll run not found");
      }
      
      // Get all items for this run
      const items = await this.getPayrollItemsByRunId(id);
      
      // Create a combined data object
      const exportData = {
        run,
        items
      };
      
      // For this example, we'll just return the JSON string
      // In a real app, you'd generate CSV/PDF files
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Error exporting payroll run:", error);
      throw error;
    }
  }
  
  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    const errors: any[] = [];
    let imported = 0;
    
    try {
      // Validate runId
      const run = await this.getPayrollRunById(runId);
      if (!run) {
        throw new Error("Payroll run not found");
      }
      
      if (run.status !== 'draft') {
        throw new Error("Can only import items to draft payroll runs");
      }
      
      // Process each item
      for (const item of data) {
        try {
          const params: CreatePayrollItemParams = {
            payrollRunId: runId,
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            grossSalary: item.grossSalary,
            regularHours: item.regularHours,
            overtimeHours: item.overtimeHours,
            hourlyRate: item.hourlyRate,
            baseSalary: item.baseSalary,
            taxAmount: 0, // Will be calculated later
            deductions: item.deductions || [],
            benefits: item.benefits || [],
            deductionAmount: item.deductionAmount || 0,
            netSalary: 0, // Will be calculated later
            notes: item.notes,
            status: 'pending'
          };
          
          await this.createPayrollItem(params);
          imported++;
        } catch (itemError) {
          errors.push({
            item,
            error: itemError.message
          });
        }
      }
      
      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      console.error("Error importing payroll items:", error);
      throw error;
    }
  }
}

// Export a singleton instance
const payrollService: IPayrollService = new SupabasePayrollService();
export default payrollService;
