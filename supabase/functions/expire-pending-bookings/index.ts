import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all expired pending bookings
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        property_id,
        properties (title)
      `)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired bookings');
      throw fetchError
    }

    const expiredCount = expiredBookings?.length || 0;

    if (!expiredBookings || expiredCount === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired bookings found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each expired booking
    const results = await Promise.all(
      expiredBookings.map(async (booking: any) => {
        try {
          // Update booking status to expired
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'expired',
              cancellation_reason: 'Auto-cancelled: Payment not completed within 15 minutes',
              cancelled_at: new Date().toISOString(),
            })
            .eq('id', booking.id)

          if (updateError) {
            console.error('Error updating booking');
            return { id: booking.id, success: false, error: updateError.message }
          }

          // Create notification for the user
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: booking.user_id,
              type: 'booking',
              title: 'Booking Expired',
              message: `Your booking for ${booking.properties?.title || 'a property'} has expired due to incomplete payment within 15 minutes.`,
              action_url: `/properties/${booking.property_id}`,
              metadata: {
                booking_id: booking.id,
                property_id: booking.property_id,
                reason: 'payment_timeout'
              }
            })

          if (notificationError) {
            console.error('Error creating notification');
          }

          return { id: booking.id, success: true }
        } catch (err) {
          console.error('Error processing booking');
          return { id: booking.id, success: false, error: (err as Error).message }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Expired ${successCount} bookings`,
        total: results.length,
        success: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in expire-pending-bookings function:', (error as Error).message)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
