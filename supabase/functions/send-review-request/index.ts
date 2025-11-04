import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Find bookings that checked out 24 hours ago and need review requests
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('status', 'confirmed')
      .eq('check_out', yesterdayStr);

    if (error) throw error;

    console.log(`Found ${bookings?.length || 0} bookings to send review requests`);

    // Send review request for each booking
    for (const booking of bookings || []) {
      try {
        await supabaseAdmin.functions.invoke('send-booking-emails', {
          body: {
            booking_id: booking.id,
            type: 'review_request'
          }
        });
        console.log(`Review request sent for booking ${booking.id}`);
      } catch (emailError) {
        console.error(`Failed to send review request for booking ${booking.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        count: bookings?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-review-request:", error);
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
