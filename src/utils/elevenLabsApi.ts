
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Cache API key for reuse
let cachedApiKey: string | null = null;

/**
 * Retrieves the ElevenLabs API key from Supabase
 */
export const getElevenLabsApiKey = async (): Promise<string> => {
  // Return cached API key if available
  if (cachedApiKey) return cachedApiKey;
  
  try {
    console.log('Requesting ElevenLabs API key from Supabase...');
    
    // Get ElevenLabs API key from Supabase
    const { data: secretData, error: secretError } = await supabase.functions.invoke('get-secret', {
      body: { name: 'ELEVENLABS_API_KEY' }
    });
    
    if (secretError) {
      console.error('Failed to retrieve API key:', secretError);
      throw new Error('Failed to retrieve API key');
    }
    
    if (!secretData?.value) {
      console.error('ElevenLabs API key not found');
      throw new Error('ElevenLabs API key not found. Please set up your API key in Supabase.');
    }
    
    const apiKey = secretData.value;
    console.log('Successfully retrieved ElevenLabs API key');
    
    // Cache the API key
    cachedApiKey = apiKey;
    return apiKey;
  } catch (error) {
    console.error('Error checking API key:', error);
    toast({
      title: "API Key Error",
      description: "Please set your ElevenLabs API key in Supabase settings.",
      variant: "destructive",
      duration: 5000,
    });
    throw error;
  }
};

/**
 * Generate speech using the ElevenLabs API
 */
export const generateSpeechWithElevenLabs = async (
  text: string, 
  apiKey: string
): Promise<Blob> => {
  console.log('Calling ElevenLabs API for speech generation...');
  
  // Call ElevenLabs API with Sarah voice (softer voice)
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream', { 
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.85,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
        speed: 0.85
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error response:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }
  
  // Return the audio blob
  const audioBlob = await response.blob();
  console.log('Audio blob received, size:', audioBlob.size, 'bytes');
  
  if (audioBlob.size < 100) {
    throw new Error('Received empty or invalid audio data');
  }
  
  return audioBlob;
};
