import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { property_id, user_id, check_in, check_out, guests } = paymentIntent.metadata;

        // Update booking status
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (bookingError) throw bookingError;

        // Create payment transaction record
        await supabaseAdmin
          .from('payment_transactions')
          .insert({
            booking_id: booking.id,
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'succeeded',
            payment_method: paymentIntent.payment_method_types[0],
          });

        // Get property details for commission calculation
        const { data: property } = await supabaseAdmin
          .from('properties')
          .select('id, commission_rate, owner_id, title')
          .eq('id', property_id)
          .single();

        if (property) {
          const grossAmount = paymentIntent.amount / 100;
          const commissionAmount = (grossAmount * property.commission_rate) / 100;
          const netAmount = grossAmount - commissionAmount;

          // Create property earnings record
          await supabaseAdmin
            .from('property_earnings')
            .insert({
              property_id: property.id,
              booking_id: booking.id,
              gross_amount: grossAmount,
              commission_amount: commissionAmount,
              net_amount: netAmount,
              payout_status: 'pending',
            });

          // Update profile earnings
          await supabaseAdmin.rpc('increment', {
            table_name: 'profiles',
            column_name: 'pending_payout',
            increment_value: netAmount,
            row_id: property.owner_id,
          }).catch(() => {
            // Fallback if RPC doesn't exist
            supabaseAdmin
              .from('profiles')
              .update({ 
                pending_payout: netAmount,
                is_property_owner: true
              })
              .eq('user_id', property.owner_id);
          });
        }

        // Send confirmation emails
        await supabaseAdmin.functions.invoke('send-booking-emails', {
          body: { 
            booking_id: booking.id,
            type: 'confirmation'
          }
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabaseAdmin
          .from('bookings')
          .update({ 
            status: 'failed',
            payment_status: 'failed'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        await supabaseAdmin
          .from('payment_transactions')
          .insert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'failed',
          });

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        
        if (charge.payment_intent) {
          await supabaseAdmin
            .from('bookings')
            .update({ 
              status: 'refunded',
              payment_status: 'refunded'
            })
            .eq('stripe_payment_intent_id', charge.payment_intent as string);

          await supabaseAdmin
            .from('payment_transactions')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent as string);
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
