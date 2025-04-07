
// Type definitions for the Supabase database schema
// These are separate from the auto-generated types.ts file

declare namespace Database {
  interface UserLog {
    id: string;
    user_id: string;
    organization_id: string;
    team_id?: string;
    module: string;
    action: string;
    record_id?: string;
    timestamp: string;
    metadata: any;
  }
  
  interface Organization {
    id: string;
    name: string;
    logo_url?: string;
    timezone?: string;
    country?: string;
    workspace_handle?: string;
  }
}
