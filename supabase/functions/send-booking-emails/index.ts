import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  booking_id: string;
  type: 'confirmation' | 'reminder' | 'review_request';
}

// Escape HTML entities for safe email content
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Authentication: decode Clerk JWT manually
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let userId: string;
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.sub;
    if (!userId) throw new Error("No sub claim");
  } catch {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { booking_id, type }: BookingEmailRequest = await req.json();

    if (!booking_id || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: booking_id and type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking details with property info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties (
          id, title, location, main_image, owner_id
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError) throw bookingError;
    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization: User must be the guest or property owner
    const isGuest = booking.user_id === userId;
    const isOwner = booking.properties?.owner_id === userId;

    if (!isGuest && !isOwner) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't have permission to send emails for this booking" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get guest email from booking record or profile
    let guestEmail = booking.guest_email;
    let guestName = booking.guest_name;

    // Fetch guest profile for name/email fallback
    const { data: guestProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', booking.user_id)
      .single();

    if (!guestEmail && guestProfile?.email) {
      guestEmail = guestProfile.email;
    }
    if (!guestName && guestProfile) {
      guestName = `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim() || 'Guest';
    }
    if (!guestName) guestName = 'Guest';

    if (!guestEmail) {
      console.error("Guest email not found for booking", booking_id);
      return new Response(
        JSON.stringify({ error: "Guest email not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const propertyTitle = booking.properties.title;
    const checkIn = new Date(booking.check_in).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const checkOut = new Date(booking.check_out).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Escape user-provided content
    const safeGuestName = escapeHtml(guestName);
    const safePropertyTitle = escapeHtml(propertyTitle);
    const safePropertyLocation = escapeHtml(booking.properties.location);
    const safeSpecialRequests = booking.special_requests ? escapeHtml(booking.special_requests) : null;

    if (type === 'confirmation') {
      // Send confirmation email to guest
      await resend.emails.send({
        from: "Lukemanbnb <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `Booking Confirmed - ${safePropertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">Booking Confirmed! 🎉</h1>
            <p>Dear ${safeGuestName},</p>
            <p>Your booking has been confirmed. We're excited to host you!</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Booking Details</h2>
              <p><strong>Property:</strong> ${safePropertyTitle}</p>
              <p><strong>Location:</strong> ${safePropertyLocation}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Check-out:</strong> ${checkOut}</p>
              <p><strong>Guests:</strong> ${booking.guests}</p>
              <p><strong>Total Amount:</strong> KES ${booking.total_price}</p>
              <p><strong>Booking Reference:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
            </div>

            ${safeSpecialRequests ? `
              <div style="margin: 20px 0;">
                <h3>Special Requests</h3>
                <p>${safeSpecialRequests}</p>
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <h3>What's Next?</h3>
              <ul>
                <li>You'll receive a reminder 24 hours before check-in</li>
                <li>Property owner may contact you with check-in instructions</li>
                <li>After your stay, we'd love to hear your feedback</li>
              </ul>
            </div>

            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br>Lukemanbnb Team</p>
          </div>
        `,
      });

      // Send notification to property owner
      if (booking.properties.owner_id) {
        const { data: ownerProfile } = await supabaseAdmin
          .from('profiles')
          .select('first_name, email')
          .eq('user_id', booking.properties.owner_id)
          .single();

        const ownerEmail = ownerProfile?.email;
        if (ownerEmail) {
          await resend.emails.send({
            from: "Lukemanbnb <onboarding@resend.dev>",
            to: [ownerEmail],
            subject: `New Booking - ${safePropertyTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0EA5E9;">New Booking Received! 🏠</h1>
                <p>You have a new booking for your property.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Booking Details</h2>
                  <p><strong>Property:</strong> ${safePropertyTitle}</p>
                  <p><strong>Guest:</strong> ${safeGuestName}</p>
                  <p><strong>Check-in:</strong> ${checkIn}</p>
                  <p><strong>Check-out:</strong> ${checkOut}</p>
                  <p><strong>Guests:</strong> ${booking.guests}</p>
                  <p><strong>Total Amount:</strong> KES ${booking.total_price}</p>
                </div>

                <p>Please prepare for your guest's arrival and ensure the property is ready.</p>
                <p>Best regards,<br>Lukemanbnb Team</p>
              </div>
            `,
          });
        }
      }
    } else if (type === 'reminder') {
      await resend.emails.send({
        from: "Lukemanbnb <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `Reminder: Check-in Tomorrow - ${safePropertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">Your Stay Begins Tomorrow! 🎉</h1>
            <p>Dear ${safeGuestName},</p>
            <p>This is a friendly reminder that your check-in is tomorrow.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Check-in Details</h2>
              <p><strong>Property:</strong> ${safePropertyTitle}</p>
              <p><strong>Location:</strong> ${safePropertyLocation}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Booking Reference:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
            </div>

            <p>Have a wonderful stay!</p>
            <p>Best regards,<br>Lukemanbnb Team</p>
          </div>
        `,
      });
    } else if (type === 'review_request') {
      await resend.emails.send({
        from: "Lukemanbnb <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `How was your stay at ${safePropertyTitle}?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">We'd Love Your Feedback! ⭐</h1>
            <p>Dear ${safeGuestName},</p>
            <p>We hope you enjoyed your stay at ${safePropertyTitle}!</p>
            
            <p>Your feedback helps other guests make informed decisions and helps property owners improve their service.</p>

            <p>Thank you for choosing Lukemanbnb!</p>
            <p>Best regards,<br>Lukemanbnb Team</p>
          </div>
        `,
      });
    }

    console.log(`Booking email (${type}) sent successfully for booking ${booking_id} by user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking emails:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
