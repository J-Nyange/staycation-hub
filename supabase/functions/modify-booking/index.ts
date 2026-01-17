import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Date format validation (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Valid modification types
const VALID_MODIFICATION_TYPES = ['dates', 'guests', 'both'];

// Sanitize error messages to prevent information leakage
const sanitizeError = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  
  if (message.includes("unauthorized") || message.includes("permission")) {
    return "You don't have permission to modify this booking";
  }
  if (message.includes("not found")) {
    return "Booking not found";
  }
  if (message.includes("validation")) {
    return "Invalid input data";
  }
  
  return "Unable to process modification request. Please try again.";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { bookingId, modificationType, newCheckIn, newCheckOut, newGuests, reason } = body;

    // Input validation
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return new Response(
        JSON.stringify({ error: "Invalid booking ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!modificationType || !VALID_MODIFICATION_TYPES.includes(modificationType)) {
      return new Response(
        JSON.stringify({ error: "Invalid modification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate dates if provided
    if (newCheckIn !== undefined && newCheckIn !== null) {
      if (!DATE_REGEX.test(newCheckIn)) {
        return new Response(
          JSON.stringify({ error: "Invalid check-in date format (expected YYYY-MM-DD)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const checkInDate = new Date(newCheckIn);
      if (isNaN(checkInDate.getTime())) {
        return new Response(
          JSON.stringify({ error: "Invalid check-in date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (newCheckOut !== undefined && newCheckOut !== null) {
      if (!DATE_REGEX.test(newCheckOut)) {
        return new Response(
          JSON.stringify({ error: "Invalid check-out date format (expected YYYY-MM-DD)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const checkOutDate = new Date(newCheckOut);
      if (isNaN(checkOutDate.getTime())) {
        return new Response(
          JSON.stringify({ error: "Invalid check-out date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate date range if both provided
    if (newCheckIn && newCheckOut) {
      const checkInDate = new Date(newCheckIn);
      const checkOutDate = new Date(newCheckOut);
      if (checkOutDate <= checkInDate) {
        return new Response(
          JSON.stringify({ error: "Check-out date must be after check-in date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate guests if provided
    if (newGuests !== undefined && newGuests !== null) {
      const guestCount = parseInt(newGuests, 10);
      if (isNaN(guestCount) || guestCount < 1 || guestCount > 100) {
        return new Response(
          JSON.stringify({ error: "Invalid guest count (must be 1-100)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate reason length
    if (reason && (typeof reason !== 'string' || reason.length > 1000)) {
      return new Response(
        JSON.stringify({ error: "Reason must be less than 1000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*, property:properties(owner_id)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError?.message);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check authorization - only guest can request modifications
    if (booking.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to modify this booking" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create modification request
    const { data: modification, error: modError } = await supabaseAdmin
      .from("booking_modifications")
      .insert({
        booking_id: bookingId,
        requested_by: user.id,
        modification_type: modificationType,
        old_check_in: booking.check_in,
        old_check_out: booking.check_out,
        new_check_in: newCheckIn || null,
        new_check_out: newCheckOut || null,
        old_guests: booking.guests,
        new_guests: newGuests ? parseInt(newGuests, 10) : null,
        reason: reason?.substring(0, 1000) || null,
      })
      .select()
      .single();

    if (modError) {
      console.error("Error creating modification:", modError.message);
      throw new Error("Failed to create modification request");
    }

    // Notify property owner
    await supabaseAdmin.from("notifications").insert({
      user_id: booking.property.owner_id,
      type: "booking",
      title: "Booking Modification Request",
      message: "A guest has requested to modify their booking",
      action_url: "/owner-dashboard",
      metadata: { booking_id: bookingId, modification_id: modification.id },
    });

    console.log(`Modification request created: ${modification.id} for booking ${bookingId} by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, modification }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Modify booking error:", error.message);
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
