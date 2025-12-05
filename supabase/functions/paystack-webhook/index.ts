import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

    // Verify webhook signature
    const hash = createHmac("sha512", secret).update(body).toString();
    
    if (hash !== signature) {
      console.log("Invalid Paystack webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const reference = data.reference;
        
        // Extract booking_id from reference (format: booking_{id}_{timestamp})
        const bookingIdMatch = reference.match(/booking_([^_]+)_/);
        if (bookingIdMatch) {
          const bookingId = bookingIdMatch[1];
          
          // Update booking status
          const { error } = await supabaseClient
            .from("bookings")
            .update({
              status: "confirmed",
              payment_status: "paid",
              stripe_payment_intent_id: reference,
            })
            .eq("id", bookingId);

          if (error) {
            console.error("Error updating booking:", error);
          } else {
            console.log(`Booking ${bookingId} confirmed via webhook`);
          }
        }
        break;
      }

      case "transfer.success": {
        // Handle payout success
        const data = event.data;
        console.log("Transfer successful:", data.reference);
        break;
      }

      case "transfer.failed": {
        // Handle payout failure
        const data = event.data;
        console.log("Transfer failed:", data.reference);
        break;
      }

      default:
        console.log("Unhandled Paystack event:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
