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
    const { reference, booking_id } = await req.json();

    if (!reference || !booking_id) {
      throw new Error("Missing reference or booking_id");
    }

    console.log(`Verifying Paystack payment: ${reference} for booking: ${booking_id}`);

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
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

    // Create payment transaction record
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
      console.error("Error creating transaction:", transactionError);
    }

    // Calculate commission
    const { data: booking } = await supabaseClient
      .from("bookings")
      .select("property_id, total_price")
      .eq("id", booking_id)
      .single();

    if (booking) {
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
    }

    console.log(`Payment verified and booking ${booking_id} confirmed`);

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
