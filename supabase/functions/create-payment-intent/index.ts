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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { property_id, check_in, check_out, guests, total_price, special_requests, booking_id } = await req.json();

    // Validate availability
    const { data: existingBookings } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('property_id', property_id)
      .in('status', ['confirmed', 'pending'])
      .gte('check_out', check_in)
      .lte('check_in', check_out);

    if (existingBookings && existingBookings.length > 0) {
      throw new Error("Property is not available for selected dates");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      
      // Update profile with Stripe customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_price * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        booking_id: booking_id || "",
        property_id,
        user_id: user.id,
        check_in,
        check_out,
        guests: guests.toString(),
      },
    });

    // Update booking with payment intent ID
    if (booking_id) {
      await supabaseClient
        .from('bookings')
        .update({ 
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending'
        })
        .eq('id', booking_id);
    }

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-payment-intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
