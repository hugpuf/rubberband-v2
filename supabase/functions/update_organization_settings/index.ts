
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the auth header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract the request body
    const { 
      org_id, 
      primary_use_case = null, 
      business_type = null, 
      workflow_style = null, 
      completed_onboarding = null 
    } = await req.json();

    if (!org_id) {
      return new Response(
        JSON.stringify({ error: "Organization ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Prepare the update data
    const updateData: Record<string, any> = {};
    
    if (primary_use_case !== null) updateData.primary_use_case = primary_use_case;
    if (business_type !== null) updateData.business_type = business_type;
    if (workflow_style !== null) updateData.workflow_style = workflow_style;
    if (completed_onboarding !== null) updateData.has_completed_onboarding = completed_onboarding;
    updateData.updated_at = new Date().toISOString();

    // Update the organization settings
    const { error } = await supabase
      .from("organization_settings")
      .update(updateData)
      .eq("organization_id", org_id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error updating organization settings:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
