import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Date format validation (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Sanitize error messages to prevent information leakage
const sanitizeError = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  
  // Map known safe errors to user-friendly messages
  if (message.includes("not available") || message.includes("availability")) {
    return "Property is not available for selected dates";
  }
  if (message.includes("not authenticated") || message.includes("unauthorized")) {
    return "Authentication required";
  }
  if (message.includes("validation")) {
    return "Invalid input data";
  }
  
  // Default safe message for all other errors
  return "Payment processing failed. Please try again.";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { property_id, check_in, check_out, guests, total_price, special_requests, booking_id } = body;

    // Input validation
    if (!property_id || !UUID_REGEX.test(property_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid property ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!check_in || !DATE_REGEX.test(check_in)) {
      return new Response(
        JSON.stringify({ error: "Invalid check-in date format (expected YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!check_out || !DATE_REGEX.test(check_out)) {
      return new Response(
        JSON.stringify({ error: "Invalid check-out date format (expected YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate date range
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid date values" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (checkInDate < today) {
      return new Response(
        JSON.stringify({ error: "Check-in date cannot be in the past" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (checkOutDate <= checkInDate) {
      return new Response(
        JSON.stringify({ error: "Check-out date must be after check-in date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate guests
    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid guest count (must be 1-100)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate total_price
    const price = parseFloat(total_price);
    if (isNaN(price) || price < 1 || price > 1000000) {
      return new Response(
        JSON.stringify({ error: "Invalid price (must be between 1 and 1,000,000)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate booking_id if provided
    if (booking_id && !UUID_REGEX.test(booking_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid booking ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate special_requests length
    if (special_requests && (typeof special_requests !== 'string' || special_requests.length > 2000)) {
      return new Response(
        JSON.stringify({ error: "Special requests must be less than 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate availability
    if (booking_id) {
      const { data: conflicts, error: conflictError } = await supabaseClient
        .from('bookings')
        .select('id')
        .eq('property_id', property_id)
        .in('status', ['confirmed', 'pending'])
        .gte('check_out', check_in)
        .lte('check_in', check_out)
        .neq('id', booking_id);
        
      if (conflictError) {
        console.error("Error checking conflicts:", conflictError.message);
        throw new Error("Failed to check availability");
      }

      if (conflicts && conflicts.length > 0) {
        throw new Error("Property is not available for selected dates");
      }
    } else {
      const { data: conflicts, error: conflictError } = await supabaseClient
        .from('bookings')
        .select('id')
        .eq('property_id', property_id)
        .in('status', ['confirmed', 'pending'])
        .gte('check_out', check_in)
        .lte('check_in', check_out);

      if (conflictError) {
        console.error("Error checking conflicts:", conflictError.message);
        throw new Error("Failed to check availability");
      }

      if (conflicts && conflicts.length > 0) {
        throw new Error("Property is not available for selected dates");
      }
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
      amount: Math.round(price * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        booking_id: booking_id || "",
        property_id,
        user_id: user.id,
        check_in,
        check_out,
        guests: guestCount.toString(),
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

    console.log(`Payment intent created: ${paymentIntent.id} for user ${user.id}`);

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
    console.error("Error in create-payment-intent:", error.message);
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
