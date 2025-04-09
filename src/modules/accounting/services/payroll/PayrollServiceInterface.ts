
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

/**
 * Interface defining the standard operations for the payroll service
 * This abstraction will allow us to swap implementations (native, Xero, etc.)
 */
export interface IPayrollService {
  // Payroll Run operations
  createPayrollRun(params: CreatePayrollRunParams & { organization_id: string }): Promise<PayrollRun>;
  getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>>;
  getPayrollRunById(id: string): Promise<PayrollRun | null>;
  updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun>;
  deletePayrollRun(id: string): Promise<boolean>;
  processPayrollRun(id: string): Promise<PayrollRun>;
  finalizePayrollRun(id: string): Promise<PayrollRun>;
  
  // Payroll Item operations
  createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem>;
  getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>>;
  getPayrollItemById(id: string): Promise<PayrollItem | null>;
  getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]>;
  updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem>;
  deletePayrollItem(id: string): Promise<boolean>;
  
  // Tax and calculation operations
  calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult>;
  recalculatePayrollItem(id: string): Promise<PayrollItem>;
  recalculatePayrollRun(id: string): Promise<PayrollRun>;
  
  // Import/Export operations
  exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string>;
  importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }>;
}
