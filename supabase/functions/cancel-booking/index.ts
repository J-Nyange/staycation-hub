import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Sanitize error messages to prevent information leakage
const sanitizeError = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  
  if (message.includes("unauthorized") || message.includes("permission")) {
    return "You don't have permission to cancel this booking";
  }
  if (message.includes("not found")) {
    return "Booking not found";
  }
  if (message.includes("refund")) {
    return "Unable to process refund. Please contact support.";
  }
  
  return "Unable to cancel booking. Please try again.";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { bookingId, reason } = body;

    // Input validation
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return new Response(
        JSON.stringify({ error: "Invalid booking ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate reason length
    if (reason && (typeof reason !== 'string' || reason.length > 1000)) {
      return new Response(
        JSON.stringify({ error: "Reason must be less than 1000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        property:properties(cancellation_policy, owner_id)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError?.message);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check authorization
    const isOwner = booking.property.owner_id === user.id;
    const isGuest = booking.user_id === user.id;
    if (!isOwner && !isGuest) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to cancel this booking" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        cancellation_reason: reason?.substring(0, 1000) || null,
        refund_amount: refundAmount,
        refund_status: refundAmount > 0 ? "pending" : "none",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error updating booking:", updateError.message);
      throw new Error("Failed to cancel booking");
    }

    // Process refund if amount > 0
    if (refundAmount > 0 && booking.stripe_payment_intent_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
        });

        await supabaseAdmin
          .from("bookings")
          .update({ refund_status: "processing" })
          .eq("id", bookingId);
      } catch (refundError: any) {
        console.error("Refund processing error:", refundError.message);
        // Don't fail the cancellation, just log the refund error
      }
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

    console.log(`Booking ${bookingId} cancelled by user ${user.id}, refund: ${refundAmount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundAmount,
        refundPercentage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cancel booking error:", error.message);
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
