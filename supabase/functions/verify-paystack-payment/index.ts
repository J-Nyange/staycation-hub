import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Paystack reference format (alphanumeric, typically 10-30 chars)
const REFERENCE_REGEX = /^[a-zA-Z0-9_-]{5,100}$/;

// Sanitize error messages to prevent information leakage
const sanitizeError = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  
  if (message.includes("unauthorized") || message.includes("permission")) {
    return "You don't have permission to verify this payment";
  }
  if (message.includes("not found")) {
    return "Booking not found";
  }
  if (message.includes("already used")) {
    return "This payment reference has already been used";
  }
  if (message.includes("not pending")) {
    return "This booking is not awaiting payment";
  }
  if (message.includes("verification failed")) {
    return "Payment verification failed";
  }
  if (message.includes("amount mismatch")) {
    return "Payment amount does not match booking total";
  }
  
  return "Unable to verify payment. Please try again or contact support.";
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // REQUIRE authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required", verified: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required", verified: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { reference, booking_id } = body;

    // Input validation
    if (!reference || !REFERENCE_REGEX.test(reference)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment reference format", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!booking_id || !UUID_REGEX.test(booking_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid booking ID format", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying Paystack payment: ${reference} for booking: ${booking_id} by user: ${user.id}`);

    // VERIFY booking belongs to user and is in pending state
    const { data: booking, error: bookingFetchError } = await supabaseClient
      .from("bookings")
      .select("user_id, property_id, total_price, status, payment_status")
      .eq("id", booking_id)
      .single();

    if (bookingFetchError || !booking) {
      console.error("Booking not found");
      return new Response(
        JSON.stringify({ error: "Booking not found", verified: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.user_id !== user.id) {
      console.error(`User ${user.id} attempted to verify booking owned by another user`);
      return new Response(
        JSON.stringify({ error: "You don't have permission to verify this payment", verified: false }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.status !== "pending") {
      console.error(`Booking ${booking_id} is not pending`);
      return new Response(
        JSON.stringify({ error: "This booking is not awaiting payment", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if reference already used (prevent replay attacks)
    const { data: existingPayment } = await supabaseClient
      .from("payment_transactions")
      .select("booking_id")
      .eq("stripe_payment_intent_id", reference)
      .single();

    if (existingPayment) {
      console.error(`Payment reference ${reference} already used`);
      return new Response(
        JSON.stringify({ error: "This payment reference has already been used", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("Paystack secret key not configured");
      return new Response(
        JSON.stringify({ error: "Payment service configuration error", verified: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Paystack verification completed");

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(
        JSON.stringify({ error: "Payment verification failed", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentData = verifyData.data;

    // Verify amount matches booking total (convert to kobo for comparison)
    const expectedAmount = Math.round(booking.total_price * 100);
    if (paymentData.amount !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount} kobo, got ${paymentData.amount} kobo`);
      return new Response(
        JSON.stringify({ error: "Payment amount does not match booking total", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update booking status
    const { error: bookingError } = await supabaseClient
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        stripe_payment_intent_id: reference, // Store Paystack reference
      })
      .eq("id", booking_id);

    if (bookingError) {
      console.error("Error updating booking");
      throw new Error("Failed to update booking status");
    }

    // Create payment transaction record with metadata for audit
    const { error: transactionError } = await supabaseClient
      .from("payment_transactions")
      .insert({
        booking_id,
        stripe_payment_intent_id: reference,
        amount: paymentData.amount / 100, // Convert from kobo
        currency: paymentData.currency?.toLowerCase() || "kes",
        status: "succeeded",
        payment_method: "paystack",
      });

    if (transactionError) {
      console.error("Error creating transaction record");
    }

    // Calculate commission
    const { data: property } = await supabaseClient
      .from("properties")
      .select("commission_rate")
      .eq("id", booking.property_id)
      .single();

    const commissionRate = property?.commission_rate || 15;
    const commissionAmount = (booking.total_price * commissionRate) / 100;
    const netAmount = booking.total_price - commissionAmount;

    // Create earnings record
    await supabaseClient.from("property_earnings").insert({
      property_id: booking.property_id,
      booking_id,
      gross_amount: booking.total_price,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      payout_status: "pending",
    });

    // Update booking with commission
    await supabaseClient
      .from("bookings")
      .update({ commission_amount: commissionAmount })
      .eq("id", booking_id);

    console.log(`Payment verified and booking ${booking_id} confirmed for user ${user.id}`);

    return new Response(
      JSON.stringify({ verified: true, message: "Payment verified successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Paystack verification error:", error.message);
    return new Response(
      JSON.stringify({ error: sanitizeError(error), verified: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
