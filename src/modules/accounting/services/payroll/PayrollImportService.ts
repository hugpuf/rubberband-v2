
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { CreatePayrollItemParams } from "../../types/payroll";
import { PayrollServiceBase } from "./PayrollServiceBase";

export class PayrollImportService extends PayrollServiceBase {
  constructor(client: SupabaseClient<Database>, organizationId: string) {
    super(client, organizationId);
  }

  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    try {
      // Verify run belongs to organization
      const { data: runData, error: runError } = await this.supabase
        .from('payroll_runs')
        .select('id')
        .eq('id', runId)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (runError || !runData) {
        throw new Error(`Payroll run ${runId} not found or unauthorized`);
      }
      
      const errors: any[] = [];
      const importedItems: any[] = [];
      
      // Process each item in the data array
      for (const item of data) {
        try {
          // Create basic payroll item data structure
          const payrollItemData: CreatePayrollItemParams = {
            payrollRunId: runId,
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            grossSalary: parseFloat(item.grossSalary) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            deductions: item.deductions || [],
            deductionAmount: parseFloat(item.deductionAmount) || 0,
            netSalary: parseFloat(item.netSalary) || 0,
            status: 'pending'
          };
          
          // Add optional fields if present
          if (item.regularHours) payrollItemData.regularHours = parseFloat(item.regularHours);
          if (item.overtimeHours) payrollItemData.overtimeHours = parseFloat(item.overtimeHours);
          if (item.hourlyRate) payrollItemData.hourlyRate = parseFloat(item.hourlyRate);
          if (item.baseSalary) payrollItemData.baseSalary = parseFloat(item.baseSalary);
          if (item.benefits) payrollItemData.benefits = item.benefits;
          if (item.notes) payrollItemData.notes = item.notes;
          
          // Create the payroll item
          const { data: createdItem, error } = await this.supabase
            .from('payroll_items')
            .insert([{
              payroll_run_id: payrollItemData.payrollRunId,
              contact_id: payrollItemData.employeeId,
              employee_name: payrollItemData.employeeName,
              gross_salary: payrollItemData.grossSalary,
              regular_hours: payrollItemData.regularHours,
              overtime_hours: payrollItemData.overtimeHours,
              hourly_rate: payrollItemData.hourlyRate,
              base_salary: payrollItemData.baseSalary,
              tax_amount: payrollItemData.taxAmount,
              deductions: payrollItemData.deductions,
              benefits: payrollItemData.benefits,
              deduction_amount: payrollItemData.deductionAmount,
              net_salary: payrollItemData.netSalary,
              notes: payrollItemData.notes,
              status: payrollItemData.status || 'pending',
            }])
            .select()
            .single();

          if (error) throw error;
          importedItems.push(createdItem);
        } catch (itemError) {
          console.error(`Error importing payroll item:`, itemError);
          errors.push({
            item,
            error: (itemError as Error).message
          });
        }
      }
      
      return {
        success: errors.length === 0,
        imported: importedItems.length,
        errors
      };
    } catch (error) {
      console.error(`Error importing payroll items to run ${runId}:`, error);
      return {
        success: false,
        imported: 0,
        errors: [{
          error: (error as Error).message
        }]
      };
    }
  }
}
