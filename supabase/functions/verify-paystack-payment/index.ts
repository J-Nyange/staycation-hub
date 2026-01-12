import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized", verified: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", verified: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const { reference, booking_id } = await req.json();

    if (!reference || !booking_id) {
      throw new Error("Missing reference or booking_id");
    }

    console.log(`Verifying Paystack payment: ${reference} for booking: ${booking_id} by user: ${user.id}`);

    // VERIFY booking belongs to user and is in pending state
    const { data: booking, error: bookingFetchError } = await supabaseClient
      .from("bookings")
      .select("user_id, property_id, total_price, status, payment_status")
      .eq("id", booking_id)
      .single();

    if (bookingFetchError || !booking) {
      console.error("Booking not found:", bookingFetchError);
      throw new Error("Booking not found");
    }

    if (booking.user_id !== user.id) {
      console.error(`User ${user.id} attempted to verify booking owned by ${booking.user_id}`);
      throw new Error("Unauthorized to verify this booking");
    }

    if (booking.status !== "pending") {
      console.error(`Booking ${booking_id} is not pending, current status: ${booking.status}`);
      throw new Error("Booking is not in pending state");
    }

    // Check if reference already used (prevent replay attacks)
    const { data: existingPayment } = await supabaseClient
      .from("payment_transactions")
      .select("booking_id")
      .eq("stripe_payment_intent_id", reference)
      .single();

    if (existingPayment) {
      console.error(`Payment reference ${reference} already used for booking ${existingPayment.booking_id}`);
      throw new Error("Payment reference already used");
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
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
    console.log("Paystack verification response:", verifyData);

    if (!verifyData.status || verifyData.data?.status !== "success") {
      throw new Error("Payment verification failed");
    }

    const paymentData = verifyData.data;

    // Verify amount matches booking total (convert to kobo for comparison)
    const expectedAmount = Math.round(booking.total_price * 100);
    if (paymentData.amount !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount} kobo, got ${paymentData.amount} kobo`);
      throw new Error(`Payment amount mismatch: expected ${expectedAmount}, got ${paymentData.amount}`);
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
      console.error("Error updating booking:", bookingError);
      throw bookingError;
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
        metadata: {
          verified_by_user_id: user.id,
          property_id: booking.property_id,
          paystack_reference: reference,
          verification_timestamp: new Date().toISOString(),
        },
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
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
    console.error("Paystack verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
