import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // This function would be called by a scheduled job (cron)
    // to send email digests of unread notifications

    const { data: users, error: usersError } = await supabaseClient
      .from("profiles")
      .select("user_id, first_name, preferred_language");

    if (usersError) throw usersError;

    for (const user of users || []) {
      // Get unread notifications for this user
      const { data: notifications, error: notifError } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", user.user_id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (notifError) {
        console.error(`Error fetching notifications for user ${user.user_id}:`, notifError);
        continue;
      }

      if (!notifications || notifications.length === 0) continue;

      // Get user email from auth
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(
        user.user_id
      );

      if (!authUser?.user?.email) continue;

      // Here you would integrate with Resend or another email service
      // For now, we'll just log
      console.log(`Would send ${notifications.length} notifications to ${authUser.user.email}`);
      
      // Example: Send email using Resend
      /*
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "notifications@yourdomain.com",
          to: authUser.user.email,
          subject: `You have ${notifications.length} new notifications`,
          html: generateEmailHTML(notifications, user.first_name),
        }),
      });
      */
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification emails processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
