
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useElevenLabs } from './useElevenLabs';
import { useSession } from './useSession';
import { useMessages, Message } from './useMessages';
import { toast } from '@/components/ui/use-toast';
import { cleanupExistingAudio } from '@/utils/speechUtils';

export type { Message };

export const useChat = () => {
  const { sessionId } = useSession();
  const { messages, addMessage } = useMessages(sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const { generateSpeech, stopSpeech, isGenerating } = useElevenLabs();
  
  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      cleanupExistingAudio();
    };
  }, [stopSpeech]);

  // Update isSpeaking when isGenerating changes
  useEffect(() => {
    setIsSpeaking(isGenerating);
  }, [isGenerating]);
  
  // Toggle mute functionality
  const toggleMute = useCallback(() => {
    // If turning mute on, stop any current speech
    if (!muted) {
      stopSpeech();
    }
    setMuted(!muted);
    console.log('Mute toggled:', !muted);
  }, [muted, stopSpeech]);
  
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId || isLoading) return;
    
    // Stop any current speech
    stopSpeech();
    
    // Add user message to state immediately for UI responsiveness
    const userMessageId = uuidv4();
    const userMessage = { id: userMessageId, text, isUser: true, emotion: currentEmotion };
    addMessage(userMessage);
    
    setIsLoading(true);
    
    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert([{
          id: userMessageId,
          session_id: sessionId,
          message: text,
          is_user: true,
          emotion: currentEmotion
        }]);
      
      // Get AI response with emotion context
      const response = await supabase.functions.invoke('chat-ai', {
        body: { 
          message: text, 
          sessionId,
          emotion: currentEmotion 
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const aiMessageId = uuidv4();
      const aiReply = response.data.reply;
      
      // Save AI response to database
      await supabase
        .from('chat_messages')
        .insert([{
          id: aiMessageId,
          session_id: sessionId,
          message: aiReply,
          is_user: false
        }]);
      
      // Update messages state with AI response
      addMessage({ id: aiMessageId, text: aiReply, isUser: false });
      
      // Generate speech for AI response using only ElevenLabs if not muted
      if (!muted) {
        try {
          console.log('Using ElevenLabs for TTS...');
          // Wait for the UI to update before generating speech
          setTimeout(async () => {
            await generateSpeech(aiReply);
          }, 100);
        } catch (error) {
          console.error('ElevenLabs TTS failed:', error);
          toast({
            title: 'Voice Synthesis Failed',
            description: 'Unable to generate speech. Please try again later.',
            variant: 'destructive',
            duration: 3000,
          });
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      addMessage({
        id: uuidv4(),
        text: "I'm having trouble connecting right now. Please try again later.",
        isUser: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentEmotion, addMessage, stopSpeech, generateSpeech, isLoading, muted]);
  
  return {
    messages,
    sendMessage,
    isLoading,
    isSpeaking,
    setCurrentEmotion,
    currentEmotion,
    toggleMute,
    muted
  };
};
