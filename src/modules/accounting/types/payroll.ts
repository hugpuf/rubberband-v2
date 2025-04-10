
import { BaseEntity } from "./common";

/**
 * Represents a payroll deduction type (e.g., taxes, insurance, retirement)
 */
export type DeductionType = 'tax' | 'insurance' | 'retirement' | 'other';

/**
 * Represents a payroll benefit type
 */
export type BenefitType = 'health' | 'dental' | 'vision' | 'retirement' | 'bonus' | 'other';

/**
 * Valid payroll run statuses
 */
export enum PayrollRunStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

/**
 * Represents a single deduction in a payroll item
 */
export interface PayrollDeduction {
  id: string;
  name: string;
  type: DeductionType;
  amount: number;
  rate?: number;
  description?: string;
}

/**
 * Represents a single benefit in a payroll item
 */
export interface PayrollBenefit {
  id: string;
  name: string;
  type: BenefitType;
  amount: number;
  description?: string;
}

/**
 * Extended PayrollItem type with more fields
 */
export interface PayrollItem extends BaseEntity {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  regularHours?: number;
  overtimeHours?: number;
  hourlyRate?: number;
  baseSalary?: number;
  taxAmount: number;
  deductions: PayrollDeduction[];
  benefits?: PayrollBenefit[];
  deductionAmount: number;
  netSalary: number;
  notes?: string;
  status: 'pending' | 'processed' | 'error';
}

/**
 * Parameters for creating a new payroll item
 */
export type CreatePayrollItemParams = Omit<PayrollItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

/**
 * Parameters for updating a payroll item
 */
export type UpdatePayrollItemParams = Partial<Omit<PayrollItem, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Enhanced PayrollRun type
 */
export interface PayrollRun extends BaseEntity {
  id: string;
  name: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: keyof typeof PayrollRunStatus | string;
  employeeCount: number;
  grossAmount: number;
  taxAmount: number;
  deductionAmount: number;
  netAmount: number;
  paymentDate: string;
  notes?: string;
  processingErrors?: string[];
}

/**
 * Parameters for creating a new payroll run
 */
export type CreatePayrollRunParams = Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt' | 'employeeCount' | 'grossAmount' | 'taxAmount' | 'deductionAmount' | 'netAmount' | 'processingErrors'> & {
  employeeIds?: string[];
};

/**
 * Parameters for updating a payroll run
 */
export type UpdatePayrollRunParams = Partial<Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Parameters for filtering payroll runs
 */
export interface PayrollRunFilterParams {
  status?: keyof typeof PayrollRunStatus | string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Parameters for filtering payroll items
 */
export interface PayrollItemFilterParams {
  payrollRunId?: string;
  employeeId?: string;
  status?: 'pending' | 'processed' | 'error';
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Tax calculation configuration
 */
export interface TaxCalculationConfig {
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate?: number;
  medicareTaxRate: number;
  socialSecurityTaxRate: number;
  thresholds?: {
    federalTax: { [incomeLevel: string]: number };
    stateTax?: { [incomeLevel: string]: number };
  };
}

/**
 * Result of a tax calculation
 */
export interface TaxCalculationResult {
  federalTax: number;
  stateTax: number;
  localTax: number;
  medicareTax: number;
  socialSecurityTax: number;
  totalTax: number;
}

/**
 * Generic paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
