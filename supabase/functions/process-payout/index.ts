import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  
  if (message.includes("not authenticated") || message.includes("unauthorized")) {
    return "Authentication required";
  }
  if (message.includes("no pending earnings")) {
    return "No pending earnings found for payout";
  }
  if (message.includes("validation")) {
    return "Invalid input data";
  }
  
  return "Unable to process payout. Please try again.";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { earning_ids } = body;

    // Input validation
    if (!earning_ids || !Array.isArray(earning_ids)) {
      return new Response(
        JSON.stringify({ error: "earning_ids must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (earning_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "earning_ids cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (earning_ids.length > 100) {
      return new Response(
        JSON.stringify({ error: "Maximum 100 earnings per payout request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all earning IDs are valid UUIDs
    for (const id of earning_ids) {
      if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        return new Response(
          JSON.stringify({ error: "Invalid earning ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get earnings details - only fetch earnings owned by this user
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .from('property_earnings')
      .select('*, properties!inner(owner_id)')
      .in('id', earning_ids)
      .eq('properties.owner_id', user.id)
      .eq('payout_status', 'pending');

    if (earningsError) {
      console.error("Error fetching earnings:", earningsError.message);
      throw new Error("Failed to fetch earnings");
    }

    if (!earnings || earnings.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pending earnings found for payout" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalPayout = earnings.reduce((sum, e) => sum + parseFloat(e.net_amount), 0);

    // Mark earnings as processing
    await supabaseAdmin
      .from('property_earnings')
      .update({ 
        payout_status: 'processing',
        payout_date: new Date().toISOString().split('T')[0]
      })
      .in('id', earning_ids);

    // TODO: Integrate with Stripe Connect for actual payout
    // For MVP, this is a manual process
    
    // Update to completed after "manual" payout
    await supabaseAdmin
      .from('property_earnings')
      .update({ payout_status: 'completed' })
      .in('id', earning_ids);

    // Update profile pending payout
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('pending_payout, total_earnings')
      .eq('user_id', user.id)
      .single();

    const newPending = Math.max(0, parseFloat(profile?.pending_payout || '0') - totalPayout);
    const newTotal = parseFloat(profile?.total_earnings || '0') + totalPayout;

    await supabaseAdmin
      .from('profiles')
      .update({ 
        pending_payout: newPending,
        total_earnings: newTotal
      })
      .eq('user_id', user.id);

    console.log(`Payout processed: ${totalPayout} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        payout_amount: totalPayout,
        message: "Payout processed successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing payout:", error.message);
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
