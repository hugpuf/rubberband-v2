
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
  teams?: string[];  // Array of team IDs to assign the user to upon acceptance
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
    const { organization_name, email, token, role, teams } = requestData;
    
    if (!email || !token || !organization_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Generate invitation link with the token and teams information
    // Note: We now direct users to the dedicated create-profile page
    let invitationLink = `${FRONTEND_URL}/create-profile?token=${token}`;
    
    // Add teams information if available
    if (teams && teams.length > 0) {
      const teamsParam = teams.join(',');
      invitationLink += `&teams=${encodeURIComponent(teamsParam)}`;
    }
    
    console.log("Invitation link generated:", invitationLink);
    console.log("Sending email to:", email);
    console.log("Organization:", organization_name);
    console.log("Role:", role);
    console.log("Teams to assign:", teams || "None");
    console.log("RESEND_API_KEY configured:", !!RESEND_API_KEY);
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ 
        success: false,
        message: "Email service not configured. RESEND_API_KEY is missing.",
        link: invitationLink 
      }), {
        status: 200, // Still return 200 to not break the flow
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Initialize Resend with API key
    const resend = new Resend(RESEND_API_KEY);
    
    // Send the actual email
    const emailResult = await resend.emails.send({
      from: "Rubberband <onboarding@resend.dev>", // Using Resend's default domain
      to: [email],
      subject: `You've been invited to join ${organization_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333;">You've been invited!</h1>
          <p>You've been invited to join <strong>${organization_name}</strong> as a <strong>${role}</strong>.</p>
          ${teams && teams.length > 0 ? `<p>You will be added to ${teams.length} team(s).</p>` : ''}
          <p style="margin: 25px 0;">
            <a href="${invitationLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Create Account & Join
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This invitation link will expire in 48 hours.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you were not expecting this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });
    
    console.log("Email sending result:", emailResult);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Invitation sent successfully",
      link: invitationLink,
      emailResult 
    }), {
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
