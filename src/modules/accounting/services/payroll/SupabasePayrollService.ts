
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import {
  PayrollItem,
  PayrollRun,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollRunFilterParams,
  PayrollItemFilterParams,
  TaxCalculationResult
} from "../../types/payroll";
import { PaginatedResponse } from "../../types/common";
import { IPayrollService } from "./PayrollServiceInterface";
import { PayrollRunService } from "./PayrollRunService";
import { PayrollItemService } from "./PayrollItemService";
import { PayrollTaxService } from "./PayrollTaxService";
import { PayrollImportService } from "./PayrollImportService";

export class SupabasePayrollService implements IPayrollService {
  private runService: PayrollRunService;
  private itemService: PayrollItemService;
  private taxService: PayrollTaxService;
  private importService: PayrollImportService;
  private organizationId: string;

  constructor(client: SupabaseClient<Database>, organizationId: string) {
    this.organizationId = organizationId;
    this.runService = new PayrollRunService(client, organizationId);
    this.itemService = new PayrollItemService(client, organizationId);
    this.taxService = new PayrollTaxService(client, organizationId);
    this.importService = new PayrollImportService(client, organizationId);
  }

  // Payroll Run operations - delegate to runService
  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    return this.runService.getPayrollRuns(filters);
  }

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    return this.runService.getPayrollRunById(id);
  }

  async createPayrollRun(params: CreatePayrollRunParams): Promise<PayrollRun> {
    // Ensure organization_id is set
    const paramsWithOrg = {
      ...params,
      organization_id: this.organizationId
    };
    return this.runService.createPayrollRun(paramsWithOrg);
  }

  async updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> {
    return this.runService.updatePayrollRun(id, updates);
  }

  async deletePayrollRun(id: string): Promise<boolean> {
    return this.runService.deletePayrollRun(id);
  }

  async processPayrollRun(id: string): Promise<PayrollRun> {
    return this.runService.processPayrollRun(id);
  }

  async finalizePayrollRun(id: string): Promise<PayrollRun> {
    return this.runService.finalizePayrollRun(id);
  }

  // Payroll Item operations - delegate to itemService
  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    return this.itemService.getPayrollItems(filters);
  }

  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    return this.itemService.getPayrollItemById(id);
  }

  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    return this.itemService.getPayrollItemsByRunId(runId);
  }

  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    // Convert params to PayrollItem shape
    const item: Omit<PayrollItem, "id" | "createdAt" | "updatedAt"> = {
      ...params,
    };
    return this.itemService.createPayrollItem(item);
  }

  async updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> {
    return this.itemService.updatePayrollItem(id, updates);
  }

  async deletePayrollItem(id: string): Promise<boolean> {
    return this.itemService.deletePayrollItem(id);
  }

  // Tax and calculation operations - delegate to taxService
  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    return this.taxService.calculateTaxes(grossAmount, employeeId);
  }

  async recalculatePayrollItem(id: string): Promise<PayrollItem> {
    const item = await this.getPayrollItemById(id);
    if (!item) {
      throw new Error(`Payroll item ${id} not found`);
    }
    return this.taxService.recalculatePayrollItem(id, item);
  }

  async recalculatePayrollRun(id: string): Promise<PayrollRun> {
    const items = await this.getPayrollItemsByRunId(id);
    return this.taxService.recalculatePayrollRun(id, items);
  }

  // Import/Export operations
  async exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> {
    return this.runService.exportPayrollRun(id, format);
  }

  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    return this.importService.importPayrollItems(runId, data);
  }
}
