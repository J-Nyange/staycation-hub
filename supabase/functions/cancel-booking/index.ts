import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

    const { bookingId, reason } = await req.json();

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        property:properties(cancellation_policy, owner_id)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (!booking) throw new Error("Booking not found");

    // Check authorization
    const isOwner = booking.property.owner_id === user.id;
    const isGuest = booking.user_id === user.id;
    if (!isOwner && !isGuest) {
      throw new Error("Unauthorized to cancel this booking");
    }

    // Calculate refund based on cancellation policy and days until check-in
    const checkInDate = new Date(booking.check_in);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let refundPercentage = 0;
    const policy = booking.property.cancellation_policy || 'moderate';

    if (isOwner) {
      // Owner cancellation: always full refund + compensation
      refundPercentage = 100;
    } else {
      // Guest cancellation: based on policy
      if (policy === 'flexible') {
        if (daysUntilCheckIn > 1) refundPercentage = 100;
        else if (daysUntilCheckIn >= 0) refundPercentage = 50;
      } else if (policy === 'moderate') {
        if (daysUntilCheckIn >= 7) refundPercentage = 100;
        else if (daysUntilCheckIn >= 3) refundPercentage = 50;
      } else if (policy === 'strict') {
        if (daysUntilCheckIn >= 30) refundPercentage = 50;
      }
    }

    const refundAmount = (booking.total_price * refundPercentage) / 100;

    // Update booking
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_status: refundAmount > 0 ? "pending" : "none",
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Process refund if amount > 0
    if (refundAmount > 0 && booking.stripe_payment_intent_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100),
        reason: isOwner ? "requested_by_customer" : "requested_by_customer",
      });

      await supabaseAdmin
        .from("bookings")
        .update({ refund_status: "processing" })
        .eq("id", bookingId);
    }

    // Create notification for the other party
    const recipientId = isOwner ? booking.user_id : booking.property.owner_id;
    await supabaseAdmin.from("notifications").insert({
      user_id: recipientId,
      type: "booking",
      title: "Booking Cancelled",
      message: `A booking has been cancelled${refundAmount > 0 ? ` with ${refundPercentage}% refund` : ""}`,
      action_url: isOwner ? "/booking-history" : "/owner-dashboard",
      metadata: { booking_id: bookingId, refund_amount: refundAmount },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundAmount,
        refundPercentage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});