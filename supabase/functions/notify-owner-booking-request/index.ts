import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyOwnerRequest {
  booking_id: string;
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

  // Authentication check
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
    const { booking_id }: NotifyOwnerRequest = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: booking_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking details with property and owner info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties (
          id, title, location, main_image, owner_id, description
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError) {
      console.error("Error fetching booking");
      throw bookingError;
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization: Only the guest who created the booking can notify the owner
    if (booking.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You can only notify owners about your own bookings" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const property = booking.properties;
    const ownerId = property.owner_id;

    if (!ownerId) {
      return new Response(JSON.stringify({ success: true, message: "No owner to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get guest profile info
    const { data: guestProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('user_id', booking.user_id)
      .single();

    const guestName = booking.guest_name || 
      (guestProfile ? `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim() : 'Guest');
    const guestPhone = booking.guest_phone || guestProfile?.phone;

    // Create in-app notification for owner
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: ownerId,
        type: 'booking',
        title: 'New Booking Request',
        message: `${guestName} wants to book ${property.title} from ${booking.check_in} to ${booking.check_out}`,
        action_url: '/owner-bookings',
        metadata: {
          booking_id: booking.id,
          property_id: property.id,
          guest_name: guestName,
          guest_email: booking.guest_email,
          guest_phone: guestPhone,
          check_in: booking.check_in,
          check_out: booking.check_out,
          guests: booking.guests,
          total_price: booking.total_price,
        }
      });

    if (notificationError) {
      console.error("Error creating notification");
    }

    // Get owner profile to find email
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, email')
      .eq('user_id', ownerId)
      .single();

    // Format dates
    const checkIn = new Date(booking.check_in).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const checkOut = new Date(booking.check_out).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Send email to owner if email is available
    const ownerEmail = ownerProfile?.email;
    if (ownerEmail) {
      try {
        // Escape all user-provided content
        const safeGuestName = escapeHtml(guestName);
        const safePropertyTitle = escapeHtml(property.title);
        const safePropertyLocation = escapeHtml(property.location);
        const safeGuestEmail = escapeHtml(booking.guest_email || '');
        const safeGuestPhone = guestPhone ? escapeHtml(guestPhone) : null;
        const safeSpecialRequests = booking.special_requests ? escapeHtml(booking.special_requests) : null;

        await resend.emails.send({
          from: "Lukemanbnb <onboarding@resend.dev>",
          to: [ownerEmail],
          subject: `New Booking Request - ${safePropertyTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0EA5E9;">New Booking Request! 📬</h1>
              <p>You have a new booking request for your property. Please contact the guest to discuss pricing and arrange payment.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Booking Details</h2>
                <p><strong>Property:</strong> ${safePropertyTitle}</p>
                <p><strong>Location:</strong> ${safePropertyLocation}</p>
                <p><strong>Check-in:</strong> ${checkIn}</p>
                <p><strong>Check-out:</strong> ${checkOut}</p>
                <p><strong>Guests:</strong> ${booking.guests}</p>
                <p><strong>Estimated Price:</strong> KES ${booking.total_price.toLocaleString()}</p>
              </div>

              <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Guest Information</h2>
                <p><strong>Name:</strong> ${safeGuestName}</p>
                <p><strong>Email:</strong> <a href="mailto:${safeGuestEmail}">${safeGuestEmail}</a></p>
                ${safeGuestPhone ? `<p><strong>Phone:</strong> <a href="tel:${safeGuestPhone}">${safeGuestPhone}</a></p>` : ''}
              </div>

              ${safeSpecialRequests ? `
                <div style="margin: 20px 0;">
                  <h3>Special Requests</h3>
                  <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px;">${safeSpecialRequests}</p>
                </div>
              ` : ''}

              <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">What to do next:</h3>
                <ol>
                  <li>Contact the guest to discuss the booking and pricing</li>
                  <li>Arrange payment directly with the guest</li>
                  <li>Once payment is received, confirm the booking in your dashboard</li>
                </ol>
              </div>

              <p>Log in to your dashboard to view more details and manage this booking request.</p>
              <p>Best regards,<br>Lukemanbnb Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending owner notification email");
        // Don't throw - email failure shouldn't fail the whole request
      }
    }

    console.log(`Owner notification sent for booking ${booking_id} by user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-owner-booking-request:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
