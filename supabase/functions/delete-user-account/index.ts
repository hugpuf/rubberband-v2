
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

    // Step 1: Verify service role key is valid before proceeding
    try {
      // Create a temporary service role client to validate the key
      const verifyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      // Test if we can access admin functions
      const { error: verifyError } = await verifyClient.auth.admin.listUsers({
        perPage: 1, 
        page: 1
      })
      
      if (verifyError) {
        console.error("Service role key validation failed:", verifyError)
        throw new Error(`Invalid service role key: ${verifyError.message}. Account deletion cannot proceed.`)
      }
      
      console.log("Service role key validated successfully")
    } catch (serviceKeyError) {
      console.error("Critical service role validation error:", serviceKeyError)
      throw new Error(`Cannot validate service role key: ${serviceKeyError.message}`)
    }
    
    // Step 2: Call the database function to delete user data
    // This must happen BEFORE auth user deletion
    try {
      const { data, error } = await supabaseClient.rpc('delete_user_account', {
        user_id_param: user.id
      })

      if (error) {
        console.error("Database cleanup error:", error)
        throw new Error(`Database operation failed: ${error.message}`)
      }

      console.log(`Database cleanup completed for user: ${user.id}`)
    } catch (dbError) {
      console.error("Database function error:", dbError)
      throw new Error(`Database cleanup failed: ${dbError.message}`)
    }

    // Step 3: Create a service role client to delete the auth user
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

    // Step 4: Delete the auth user 
    try {
      const { error: deleteUserError } = await serviceRoleClient.auth.admin.deleteUser(
        user.id
      )

      if (deleteUserError) {
        console.error("Auth user deletion error:", deleteUserError)
        throw new Error(`Failed to delete auth user: ${deleteUserError.message}`)
      }

      console.log(`Auth user ${user.id} deleted successfully`)
    } catch (authDeleteError) {
      console.error("Auth deletion error:", authDeleteError)
      throw new Error(`Auth user deletion failed: ${authDeleteError.message}`)
    }

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
