
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, emotion } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    // Get Gemini API key from environment
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });

    // Enhanced emotion context with predefined responses for certain emotions
    let emotionContext = "";
    let emotionResponse = "";
    
    if (emotion) {
      console.log("Detected emotion:", emotion);
      
      emotionContext = `The user appears to be feeling ${emotion}. Respond with appropriate empathy.`;
      
      // Add specific responses for strong emotions
      if (emotion === 'sad') {
        emotionResponse = "I notice you seem sad. Remember that it's okay to feel this way, and these feelings won't last forever. ";
      } else if (emotion === 'angry') {
        emotionResponse = "I can sense you might be frustrated. Taking a few deep breaths can sometimes help with these feelings. ";
      } else if (emotion === 'fearful') {
        emotionResponse = "I'm detecting some anxiety. Remember that you're safe and it's okay to take things one step at a time. ";
      } else if (emotion === 'happy') {
        emotionResponse = "It's wonderful to see you're in good spirits! Let's keep that positive energy flowing. ";
      }
    }
    
    // Check if user explicitly asked for tips
    const requestsTips = message.toLowerCase().includes('tips') || 
                         message.toLowerCase().includes('advice') || 
                         message.toLowerCase().includes('help me') ||
                         message.toLowerCase().includes('how can i');
    
    // Therapy-focused prompt - only include tips if requested
    const prompt = `
      You are a compassionate mental health support AI assistant. Your goal is to provide brief, empathetic responses in a therapeutic manner.
      ${emotionContext}
      
      Guidelines:
      1. Keep your response concise (under 3 paragraphs)
      2. ${requestsTips ? 'Include 2-3 actionable bullet points at the end labeled "Tips:"' : 'DO NOT include tips or bullet points unless explicitly requested'}
      3. Be supportive but not overly clinical
      4. If the user is in crisis, suggest professional resources
      5. Maintain a warm, caring tone
      6. Acknowledge the user's emotional state when appropriate
      
      Start your response with: "${emotionResponse}"
      
      User's message: ${message}
    `;

    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("Generated response:", response);
    
    return new Response(
      JSON.stringify({ 
        reply: response,
        sessionId: sessionId || crypto.randomUUID() 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
