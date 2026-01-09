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

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-owner-booking-request: Function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { booking_id }: NotifyOwnerRequest = await req.json();
    console.log("notify-owner-booking-request: Processing booking", booking_id);

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
      console.error("notify-owner-booking-request: Error fetching booking", bookingError);
      throw bookingError;
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    console.log("notify-owner-booking-request: Booking found", booking.id);

    const property = booking.properties;
    const ownerId = property.owner_id;

    if (!ownerId) {
      console.log("notify-owner-booking-request: No owner_id found for property");
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
      console.error("notify-owner-booking-request: Error creating notification", notificationError);
    } else {
      console.log("notify-owner-booking-request: In-app notification created");
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
      console.log("notify-owner-booking-request: Sending email to owner", ownerEmail);
      
      try {
        await resend.emails.send({
          from: "Lukemanbnb <onboarding@resend.dev>",
          to: [ownerEmail],
          subject: `New Booking Request - ${property.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0EA5E9;">New Booking Request! 📬</h1>
              <p>You have a new booking request for your property. Please contact the guest to discuss pricing and arrange payment.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Booking Details</h2>
                <p><strong>Property:</strong> ${property.title}</p>
                <p><strong>Location:</strong> ${property.location}</p>
                <p><strong>Check-in:</strong> ${checkIn}</p>
                <p><strong>Check-out:</strong> ${checkOut}</p>
                <p><strong>Guests:</strong> ${booking.guests}</p>
                <p><strong>Estimated Price:</strong> KES ${booking.total_price.toLocaleString()}</p>
              </div>

              <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Guest Information</h2>
                <p><strong>Name:</strong> ${guestName}</p>
                <p><strong>Email:</strong> <a href="mailto:${booking.guest_email}">${booking.guest_email}</a></p>
                ${guestPhone ? `<p><strong>Phone:</strong> <a href="tel:${guestPhone}">${guestPhone}</a></p>` : ''}
              </div>

              ${booking.special_requests ? `
                <div style="margin: 20px 0;">
                  <h3>Special Requests</h3>
                  <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px;">${booking.special_requests}</p>
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
        console.log("notify-owner-booking-request: Email sent successfully");
      } catch (emailError) {
        console.error("notify-owner-booking-request: Error sending email", emailError);
        // Don't throw - email failure shouldn't fail the whole request
      }
    } else {
      console.log("notify-owner-booking-request: No owner email found, skipping email notification");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("notify-owner-booking-request: Error", error);
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
