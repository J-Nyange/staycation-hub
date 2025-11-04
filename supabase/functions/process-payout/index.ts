import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");

    const { earning_ids } = await req.json();

    // Get earnings details
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .from('property_earnings')
      .select('*, properties!inner(owner_id)')
      .in('id', earning_ids)
      .eq('properties.owner_id', user.id)
      .eq('payout_status', 'pending');

    if (earningsError) throw earningsError;

    if (!earnings || earnings.length === 0) {
      throw new Error("No pending earnings found");
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
    console.error("Error processing payout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
