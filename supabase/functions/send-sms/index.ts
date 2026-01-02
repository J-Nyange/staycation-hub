import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { user_id, phone_number, message, message_type } = await req.json();

    console.log("Sending SMS to:", phone_number);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured - logging SMS only");
      
      // Log the SMS attempt even if Twilio is not configured
      const { error: logError } = await supabaseClient
        .from('sms_logs')
        .insert({
          user_id,
          phone_number,
          message,
          message_type,
          status: 'not_configured',
          error_message: 'Twilio credentials not configured',
        });

      if (logError) console.error("Error logging SMS:", logError);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "SMS service not configured" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', phone_number);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();
    console.log("Twilio response:", twilioData);

    // Log the SMS
    const { error: logError } = await supabaseClient
      .from('sms_logs')
      .insert({
        user_id,
        phone_number,
        message,
        message_type,
        status: twilioResponse.ok ? 'sent' : 'failed',
        twilio_sid: twilioData.sid || null,
        error_message: twilioData.message || null,
      });

    if (logError) console.error("Error logging SMS:", logError);

    if (!twilioResponse.ok) {
      throw new Error(twilioData.message || 'Failed to send SMS');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sid: twilioData.sid 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in send-sms:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
