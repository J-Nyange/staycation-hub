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
    const { booking_id } = await req.json();

    // Get booking and property details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties (id, commission_rate, owner_id)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError) throw bookingError;

    const property = booking.properties;
    const grossAmount = parseFloat(booking.total_price);
    const commissionRate = property.commission_rate || 15;
    const commissionAmount = (grossAmount * commissionRate) / 100;
    const netAmount = grossAmount - commissionAmount;

    // Update booking with commission
    await supabaseAdmin
      .from('bookings')
      .update({ commission_amount: commissionAmount })
      .eq('id', booking_id);

    // Create or update property earnings record
    const { data: existingEarning } = await supabaseAdmin
      .from('property_earnings')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingEarning) {
      await supabaseAdmin
        .from('property_earnings')
        .update({
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
        })
        .eq('id', existingEarning.id);
    } else {
      await supabaseAdmin
        .from('property_earnings')
        .insert({
          property_id: property.id,
          booking_id: booking_id,
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          payout_status: 'pending',
        });
    }

    // Update owner's pending payout
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('pending_payout')
      .eq('user_id', property.owner_id)
      .single();

    const currentPending = parseFloat(profile?.pending_payout || '0');
    const newPending = currentPending + netAmount;

    await supabaseAdmin
      .from('profiles')
      .update({ 
        pending_payout: newPending,
        is_property_owner: true
      })
      .eq('user_id', property.owner_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        commission_amount: commissionAmount,
        net_amount: netAmount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error calculating commission:", error);
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
