import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push library for Deno
async function sendWebPush(subscription: any, payload: string, vapidDetails: any) {
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: payload,
  });
  
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // This function is internal-only - verify it's called with service role key or from another edge function
  const authHeader = req.headers.get("Authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Option 1: Called with service role key (from cron or internal systems)
  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
  
  // Option 2: Called from another edge function with internal secret
  const internalSecretEnv = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const isInternalCall = internalSecretEnv && internalSecret === internalSecretEnv;

  // Option 3: Called by authenticated user who can only send to themselves
  let authenticatedUserId: string | null = null;
  if (!isServiceRole && !isInternalCall && authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user: authUser }, error: authError } = await supabaseUserClient.auth.getUser();
    if (!authError && authUser) {
      authenticatedUserId = authUser.id;
    }
  }

  // If none of the above, reject
  if (!isServiceRole && !isInternalCall && !authenticatedUserId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: This function requires authentication" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { user_id, title, message, action_url, notification_type } = await req.json();

    // If called by authenticated user, they can only send notifications to themselves
    if (authenticatedUserId && user_id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You can only send push notifications to yourself" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending push notification to user:", user_id);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/Logo/lukemanLogo.png',
      badge: '/Logo/lukemanLogo.png',
      data: { 
        url: action_url,
        type: notification_type 
      }
    });

    const results = [];

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          }
        };

        // Note: In production, use web-push library with VAPID keys
        // For now, we'll store the notification attempt
        console.log("Would send push to:", subscription.endpoint);
        
        results.push({ 
          success: true, 
          endpoint: subscription.endpoint 
        });

      } catch (error: any) {
        console.error("Error sending to subscription:", error);
        
        // If subscription is no longer valid, delete it
        if (error.statusCode === 410) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
        
        results.push({ 
          success: false, 
          endpoint: subscription.endpoint, 
          error: error.message 
        });
      }
    }

    console.log("Push notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
