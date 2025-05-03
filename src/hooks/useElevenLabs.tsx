
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { canPlayMP3, cleanupExistingAudio } from '@/utils/speechUtils';
import { getElevenLabsApiKey, generateSpeechWithElevenLabs } from '@/utils/elevenLabsApi';
import { useAudioPlayback } from './useAudioPlayback';

export const useElevenLabs = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isMountedRef = useRef(true);
  const { playAudioBlob, isPlaying } = useAudioPlayback();
  
  // Clean up audio element on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupExistingAudio();
    };
  }, []);

  // Update isGenerating when isPlaying changes
  useEffect(() => {
    if (!isPlaying && isGenerating) {
      setIsGenerating(false);
    }
  }, [isPlaying, isGenerating]);

  const generateSpeech = async (text: string): Promise<void> => {
    if (!text.trim() || !isMountedRef.current) return;
    
    // First check if audio is supported
    if (!canPlayMP3()) {
      console.error('MP3 audio not supported in this browser');
      toast({
        title: 'Audio Not Supported',
        description: 'Your browser does not support MP3 audio playback.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Stop any previous audio to prevent repetition
      cleanupExistingAudio();
      
      setIsGenerating(true);
      
      // Get ElevenLabs API key
      const apiKey = await getElevenLabsApiKey();
      
      // Generate speech using ElevenLabs API
      const audioBlob = await generateSpeechWithElevenLabs(text, apiKey);
      
      // Play the audio blob
      await playAudioBlob(audioBlob);
      
    } catch (error) {
      console.error('Error generating speech:', error);
      if (isMountedRef.current) {
        toast({
          title: 'Speech Generation Failed',
          description: error instanceof Error ? error.message : 'Failed to generate speech',
          variant: 'destructive',
          duration: 5000,
        });
        setIsGenerating(false);
      }
    }
  };

  const stopSpeech = () => {
    cleanupExistingAudio();
    setIsGenerating(false);
    console.log('Speech stopped');
  };

  return {
    generateSpeech,
    stopSpeech,
    isGenerating
  };
};

// Add missing useRef import
import { useRef } from 'react';
