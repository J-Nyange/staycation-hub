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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { booking_id, type }: BookingEmailRequest = await req.json();

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties (
          id, title, location, main_image, owner_id,
          profiles!properties_owner_id_fkey (first_name, last_name)
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError) throw bookingError;

    // Get guest profile
    const { data: guestProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', booking.user_id)
      .single();

    // Get guest email from auth.users
    const { data: { user: guestUser } } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
    
    if (!guestUser?.email) throw new Error("Guest email not found");

    const guestName = guestProfile?.first_name || guestUser.email;
    const propertyTitle = booking.properties.title;
    const checkIn = new Date(booking.check_in).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const checkOut = new Date(booking.check_out).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    if (type === 'confirmation') {
      // Send confirmation email to guest
      await resend.emails.send({
        from: "Villa Horizon <onboarding@resend.dev>",
        to: [guestUser.email],
        subject: `Booking Confirmed - ${propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">Booking Confirmed! 🎉</h1>
            <p>Dear ${guestName},</p>
            <p>Your booking has been confirmed. We're excited to host you!</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Booking Details</h2>
              <p><strong>Property:</strong> ${propertyTitle}</p>
              <p><strong>Location:</strong> ${booking.properties.location}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Check-out:</strong> ${checkOut}</p>
              <p><strong>Guests:</strong> ${booking.guests}</p>
              <p><strong>Total Amount:</strong> $${booking.total_price}</p>
              <p><strong>Booking Reference:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
            </div>

            ${booking.special_requests ? `
              <div style="margin: 20px 0;">
                <h3>Special Requests</h3>
                <p>${booking.special_requests}</p>
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
            <p>Best regards,<br>Villa Horizon Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Need to cancel? Check our <a href="https://your-domain.com/cancellation-policy">cancellation policy</a>.</p>
            </div>
          </div>
        `,
      });

      // Send notification to property owner
      if (booking.properties.owner_id) {
        const { data: { user: ownerUser } } = await supabaseAdmin.auth.admin.getUserById(booking.properties.owner_id);
        
        if (ownerUser?.email) {
          await resend.emails.send({
            from: "Villa Horizon <onboarding@resend.dev>",
            to: [ownerUser.email],
            subject: `New Booking - ${propertyTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0EA5E9;">New Booking Received! 🏠</h1>
                <p>You have a new booking for your property.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Booking Details</h2>
                  <p><strong>Property:</strong> ${propertyTitle}</p>
                  <p><strong>Guest:</strong> ${guestName}</p>
                  <p><strong>Check-in:</strong> ${checkIn}</p>
                  <p><strong>Check-out:</strong> ${checkOut}</p>
                  <p><strong>Guests:</strong> ${booking.guests}</p>
                  <p><strong>Total Amount:</strong> $${booking.total_price}</p>
                </div>

                <p>Please prepare for your guest's arrival and ensure the property is ready.</p>
                <p>Best regards,<br>Villa Horizon Team</p>
              </div>
            `,
          });
        }
      }
    } else if (type === 'reminder') {
      // Send check-in reminder to guest
      await resend.emails.send({
        from: "Villa Horizon <onboarding@resend.dev>",
        to: [guestUser.email],
        subject: `Reminder: Check-in Tomorrow - ${propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">Your Stay Begins Tomorrow! 🎉</h1>
            <p>Dear ${guestName},</p>
            <p>This is a friendly reminder that your check-in is tomorrow.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Check-in Details</h2>
              <p><strong>Property:</strong> ${propertyTitle}</p>
              <p><strong>Location:</strong> ${booking.properties.location}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Booking Reference:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
            </div>

            <p>Have a wonderful stay!</p>
            <p>Best regards,<br>Villa Horizon Team</p>
          </div>
        `,
      });
    } else if (type === 'review_request') {
      // Send review request after checkout
      await resend.emails.send({
        from: "Villa Horizon <onboarding@resend.dev>",
        to: [guestUser.email],
        subject: `How was your stay at ${propertyTitle}?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0EA5E9;">We'd Love Your Feedback! ⭐</h1>
            <p>Dear ${guestName},</p>
            <p>We hope you enjoyed your stay at ${propertyTitle}!</p>
            
            <p>Your feedback helps other guests make informed decisions and helps property owners improve their service.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-domain.com/properties/${booking.properties.id}?review=true&booking=${booking.id}" 
                 style="background-color: #0EA5E9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Write a Review
              </a>
            </div>

            <p>Thank you for choosing Villa Horizon!</p>
            <p>Best regards,<br>Villa Horizon Team</p>
          </div>
        `,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending booking emails:", error);
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
