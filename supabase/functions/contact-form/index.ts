import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Resend from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact form function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactFormRequest = await req.json();
    console.log("Received contact form data:", { ...data, message: data.message.substring(0, 50) + "..." });

    // Validate input
    if (!data.firstName || !data.lastName || !data.email || !data.message) {
      throw new Error("Missing required fields");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Send email to property owner
    const ownerEmailResponse = await resend.emails.send({
      from: "Villa Horizon Contact <onboarding@resend.dev>",
      to: ["vilahorizon04@gmail.com"], // Owner's email
      subject: `New Contact Form: ${data.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Owner email sent successfully:", ownerEmailResponse);

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "Villa Horizon <onboarding@resend.dev>",
      to: [data.email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${data.firstName}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Best regards,<br>The Villa Horizon Team</p>
      `,
    });

    console.log("Confirmation email sent successfully:", userEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your message has been sent successfully!"
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in contact-form function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send message"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
