
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { TaxCalculationResult, PayrollItem, PayrollRun } from "../../types/payroll";
import { PayrollServiceBase } from "./PayrollServiceBase";

export class PayrollTaxService extends PayrollServiceBase {
  constructor(client: SupabaseClient<Database>, organizationId: string) {
    super(client, organizationId);
  }

  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    // Simple tax calculation implementation
    // In a real app, this would use complex tax tables and employee information
    try {
      const federalTaxRate = 0.15; // 15% federal tax
      const stateTaxRate = 0.05;   // 5% state tax
      const medicareTaxRate = 0.0145; // 1.45% Medicare
      const socialSecurityTaxRate = 0.062; // 6.2% Social Security
      
      const federalTax = grossAmount * federalTaxRate;
      const stateTax = grossAmount * stateTaxRate;
      const medicareTax = grossAmount * medicareTaxRate;
      const socialSecurityTax = grossAmount * socialSecurityTaxRate;
      
      const totalTax = federalTax + stateTax + medicareTax + socialSecurityTax;
      
      return {
        federalTax,
        stateTax,
        localTax: 0, // No local tax in this simple example
        medicareTax,
        socialSecurityTax,
        totalTax
      };
    } catch (error) {
      console.error(`Error calculating taxes for employee ${employeeId}:`, error);
      // Return zero taxes in case of error
      return {
        federalTax: 0,
        stateTax: 0,
        localTax: 0,
        medicareTax: 0,
        socialSecurityTax: 0,
        totalTax: 0
      };
    }
  }

  async recalculatePayrollItem(id: string, payrollItem: PayrollItem): Promise<PayrollItem> {
    try {
      // Recalculate taxes
      const taxResult = await this.calculateTaxes(payrollItem.grossSalary, payrollItem.employeeId);
      
      // Calculate total deductions (tax + other deductions)
      let deductionAmount = taxResult.totalTax;
      (payrollItem.deductions || []).forEach(d => {
        deductionAmount += d.amount;
      });
      
      // Calculate net salary
      const netSalary = payrollItem.grossSalary - deductionAmount;
      
      // Update the item with new calculations
      const { data, error } = await this.supabase
        .from('payroll_items')
        .update({
          tax_amount: taxResult.totalTax,
          deduction_amount: deductionAmount,
          net_salary: netSalary
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      
      return this.mapPayrollItemFromDB(data);
    } catch (error) {
      console.error(`Error recalculating payroll item ${id}:`, error);
      throw error;
    }
  }

  async recalculatePayrollRun(id: string, items: PayrollItem[]): Promise<PayrollRun> {
    try {
      // Calculate totals
      const employeeCount = items.length;
      const grossAmount = items.reduce((sum, item) => sum + item.grossSalary, 0);
      const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const deductionAmount = items.reduce((sum, item) => sum + item.deductionAmount, 0);
      const netAmount = items.reduce((sum, item) => sum + item.netSalary, 0);
      
      // Update the payroll run
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({
          employee_count: employeeCount,
          gross_amount: grossAmount,
          tax_amount: taxAmount,
          deduction_amount: deductionAmount,
          net_amount: netAmount
        })
        .eq('id', id)
        .eq('organization_id', this.organizationId)
        .select('*')
        .single();
        
      if (error) throw error;
      
      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error recalculating payroll run ${id}:`, error);
      throw error;
    }
  }
}
