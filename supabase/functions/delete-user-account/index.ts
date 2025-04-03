
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Delete user account function invoked")
    
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) {
      console.error("Authentication error:", userError)
      throw new Error(`Authentication failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error("No authenticated user found")
      throw new Error('Not authenticated - no user found in session')
    }

    console.log(`User ${user.id} requested account deletion`)
    
    // IMPORTANT: Log the exact user ID to verify we're only deleting the specific auth UUID
    console.log(`Will delete data for user ID: ${user.id}`)
    
    // Log the email for debugging, but NEVER use email for deletion matching
    console.log(`Associated email (for logging only): ${user.email}`)

    // Call the database function to delete user data
    const { data, error } = await supabaseClient.rpc('delete_user_account', {
      user_id_param: user.id
    })

    if (error) {
      console.error("RPC error:", error)
      throw new Error(`Database operation failed: ${error.message}`)
    }

    console.log(`Database cleanup completed for user: ${user.id}`)

    // Create a service role client to delete the auth user
    // IMPORTANT: This must have the correct service role key to work
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify if the service role key is valid - this is critical
    try {
      const { data: adminData, error: adminError } = await serviceRoleClient.auth.admin.listUsers({
        perPage: 1
      })
      
      if (adminError) {
        console.error("Service role validation error:", adminError)
        throw new Error(`Service role key invalid: ${adminError.message}`)
      }

      console.log("Service role key validated successfully")
    } catch (serviceRoleError) {
      console.error("Fatal service role error:", serviceRoleError)
      throw new Error(`Cannot access admin API: ${serviceRoleError.message}`)
    }

    // Delete the auth user with the service role client
    // This is critical - must happen AFTER database cleanup
    const { error: deleteUserError } = await serviceRoleClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError) {
      console.error("Auth user deletion error:", deleteUserError)
      throw new Error(`Failed to delete auth user: ${deleteUserError.message}`)
    }

    console.log(`Auth user ${user.id} deleted successfully`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your account has been successfully deleted',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Enhanced error logging
    console.error('Error in delete-user-account function:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Return detailed error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete account',
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
