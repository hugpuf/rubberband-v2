
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  invitation_id: string;
  organization_name: string;
  email: string;
  token: string;
  role: string;
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse request body
    const requestData: RequestBody = await req.json();
    const { organization_name, email, token, role } = requestData;
    
    if (!email || !token || !organization_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Generate invitation link
    const invitationLink = `${FRONTEND_URL}/accept-invitation?token=${token}`;
    
    console.log("Invitation link generated:", invitationLink);
    console.log("Would send email to:", email);
    console.log("Organization:", organization_name);
    console.log("Role:", role);
    
    // In a real implementation, you'd use a service like Resend, SendGrid, etc.
    // to send the actual email. For now, we'll just log the details.
    
    /* Example with Resend:
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    await resend.emails.send({
      from: "Organization <noreply@yourdomain.com>",
      to: [email],
      subject: `You've been invited to join ${organization_name}`,
      html: `
        <h1>You've been invited!</h1>
        <p>You've been invited to join <strong>${organization_name}</strong> as a <strong>${role}</strong>.</p>
        <p><a href="${invitationLink}">Click here to accept the invitation</a></p>
        <p>This invitation link will expire in 48 hours.</p>
      `,
    });
    */
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handler);
