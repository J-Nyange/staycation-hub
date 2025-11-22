import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { bookingId, modificationType, newCheckIn, newCheckOut, newGuests, reason } = await req.json();

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*, property:properties(owner_id)")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (!booking) throw new Error("Booking not found");

    // Check authorization - only guest can request modifications
    if (booking.user_id !== user.id) {
      throw new Error("Unauthorized to modify this booking");
    }

    // Create modification request
    const { data: modification, error: modError } = await supabaseAdmin
      .from("booking_modifications")
      .insert({
        booking_id: bookingId,
        requested_by: user.id,
        modification_type: modificationType,
        old_check_in: booking.check_in,
        old_check_out: booking.check_out,
        new_check_in: newCheckIn,
        new_check_out: newCheckOut,
        old_guests: booking.guests,
        new_guests: newGuests,
        reason,
      })
      .select()
      .single();

    if (modError) throw modError;

    // Notify property owner
    await supabaseAdmin.from("notifications").insert({
      user_id: booking.property.owner_id,
      type: "booking",
      title: "Booking Modification Request",
      message: "A guest has requested to modify their booking",
      action_url: "/owner-dashboard",
      metadata: { booking_id: bookingId, modification_id: modification.id },
    });

    return new Response(
      JSON.stringify({ success: true, modification }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Modify booking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});