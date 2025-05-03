
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not found in environment variables')
    }

    // Simple test request to ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    const voicesData = await response.json()

    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'ElevenLabs API key is valid',
        voiceCount: voicesData.voices?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error testing ElevenLabs API:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
