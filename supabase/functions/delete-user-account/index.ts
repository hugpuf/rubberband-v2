
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's JWT from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Authentication failed: " + (userError?.message || "No user found"));
    }

    // Parse request body
    const { isLastMember } = await req.json();
    
    console.log(`Processing account deletion for user ${user.id}, isLastMember: ${isLastMember}`);

    if (isLastMember) {
      // For the last member, delete the organization which will cascade to other tables
      // First get the organization ID
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRolesError) {
        throw new Error("Failed to fetch user roles: " + userRolesError.message);
      }

      if (!userRoles?.organization_id) {
        throw new Error("User does not belong to any organization");
      }

      console.log(`Deleting organization ${userRoles.organization_id} as last member`);

      // Delete organization (will cascade delete settings, etc.)
      const { error: deleteOrgError } = await supabase
        .from("organizations")
        .delete()
        .eq("id", userRoles.organization_id);

      if (deleteOrgError) {
        throw new Error("Failed to delete organization: " + deleteOrgError.message);
      }
    } else {
      // For non-last member, just delete user-specific data
      console.log(`Deleting user ${user.id} data but keeping organization`);
      
      // Delete user_roles (memberships in organizations)
      const { error: deleteRolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteRolesError) {
        throw new Error("Failed to delete user roles: " + deleteRolesError.message);
      }
    }

    // Finally, delete the Supabase auth user
    // We do this via the admin API, which is a special endpoint to delete users
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      throw new Error("Failed to delete user account: " + deleteUserError.message);
    }

    console.log(`User account ${user.id} successfully deleted`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Account successfully deleted" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting account:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
