import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'Villa-Horizon-App' } }
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find properties missing coordinates
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, location')
      .is('latitude', null)
      .is('longitude', null)
      .not('location', 'is', null)

    if (error) throw error
    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ geocoded: 0, message: 'No properties need geocoding' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let geocoded = 0
    const errors: string[] = []

    for (const prop of properties) {
      const result = await geocodeAddress(prop.location)
      if (result) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ latitude: result.lat, longitude: result.lon })
          .eq('id', prop.id)

        if (updateError) {
          errors.push(`Failed to update ${prop.id}: ${updateError.message}`)
        } else {
          geocoded++
        }
      } else {
        errors.push(`Could not geocode: ${prop.location}`)
      }

      // Respect Nominatim rate limit (1 req/sec)
      await new Promise((r) => setTimeout(r, 1100))
    }

    return new Response(
      JSON.stringify({ geocoded, total: properties.length, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
