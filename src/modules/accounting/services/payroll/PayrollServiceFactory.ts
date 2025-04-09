
import { IPayrollService } from "./PayrollServiceInterface";
import defaultPayrollService from "./SupabasePayrollService";

/**
 * Factory for creating and retrieving PayrollService instances
 * This allows us to implement dependency injection and swap implementations
 */
export class PayrollServiceFactory {
  private static instance: PayrollServiceFactory;
  private serviceMap: Map<string, IPayrollService> = new Map();
  private defaultService: IPayrollService;

  private constructor() {
    this.defaultService = defaultPayrollService;
    this.serviceMap.set('supabase', this.defaultService);
  }

  /**
   * Get the singleton instance of the factory
   */
  public static getInstance(): PayrollServiceFactory {
    if (!PayrollServiceFactory.instance) {
      PayrollServiceFactory.instance = new PayrollServiceFactory();
    }
    return PayrollServiceFactory.instance;
  }

  /**
   * Register a service implementation with the factory
   */
  public registerService(name: string, service: IPayrollService): void {
    this.serviceMap.set(name, service);
  }

  /**
   * Get a service implementation by name
   * @param name The name of the service implementation
   * @returns The service implementation or the default implementation if not found
   */
  public getService(name?: string): IPayrollService {
    if (!name) {
      return this.defaultService;
    }
    
    const service = this.serviceMap.get(name);
    return service || this.defaultService;
  }

  /**
   * Set the default service implementation
   */
  public setDefaultService(name: string): boolean {
    const service = this.serviceMap.get(name);
    if (service) {
      this.defaultService = service;
      return true;
    }
    return false;
  }
}

// Export a singleton instance of the factory
export const payrollServiceFactory = PayrollServiceFactory.getInstance();

// Export default service for convenience
export default defaultPayrollService;
