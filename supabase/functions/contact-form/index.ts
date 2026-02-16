import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

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

// Escape HTML entities to prevent XSS in emails
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Sanitize error messages
const sanitizeError = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  
  if (message.includes("missing required")) {
    return "Please fill in all required fields";
  }
  if (message.includes("too long")) {
    return "One or more fields exceed the maximum length";
  }
  if (message.includes("invalid email")) {
    return "Please enter a valid email address";
  }
  if (message.includes("failed to send")) {
    return "Unable to send your message. Please try again later.";
  }
  
  return "Failed to send message. Please try again.";
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact form function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactFormRequest = await req.json();
    
    // Validate required fields
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new Error("Missing required fields");
    }

    // Input length limits to prevent abuse
    if (data.firstName.length > 100) {
      throw new Error("First name too long");
    }
    if (data.lastName.length > 100) {
      throw new Error("Last name too long");
    }
    if (data.subject && data.subject.length > 200) {
      throw new Error("Subject too long");
    }
    if (data.message.length > 5000) {
      throw new Error("Message too long");
    }
    if (data.phone && data.phone.length > 30) {
      throw new Error("Phone number too long");
    }

    // Email validation - strict regex to prevent header injection
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(data.email) || data.email.length > 255) {
      throw new Error("Invalid email format");
    }

    // Sanitize all user inputs before using in HTML
    const safeFirstName = escapeHtml(data.firstName.trim());
    const safeLastName = escapeHtml(data.lastName.trim());
    const safeEmail = escapeHtml(data.email.trim());
    const safePhone = escapeHtml((data.phone || 'Not provided').trim());
    const safeSubject = escapeHtml((data.subject || 'No subject').trim());
    const safeMessage = escapeHtml(data.message.trim()).replace(/\n/g, '<br>');

    // Send email to property owner
    const ownerEmailResponse = await resend.emails.send({
      from: "Lukemanbnb Contact <onboarding@resend.dev>",
      to: ["info@lukemanbnb.com"], // Owner's email
      subject: `New Contact Form: ${safeSubject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeFirstName} ${safeLastName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    if (ownerEmailResponse.error) {
      console.error("Error sending owner email");
      throw new Error("Failed to send email");
    }

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "Lukemanbnb <onboarding@resend.dev>",
      to: [data.email.trim()],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${safeFirstName}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${safeMessage}</p>
        <br>
        <p>Best regards,<br>The Lukemanbnb Team</p>
      `,
    });

    if (userEmailResponse.error) {
      console.error("Error sending confirmation email");
    }

    console.log("Contact form processed successfully");

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
    console.error("Error in contact-form function:", error.message);
    return new Response(
      JSON.stringify({ 
        error: sanitizeError(error)
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
