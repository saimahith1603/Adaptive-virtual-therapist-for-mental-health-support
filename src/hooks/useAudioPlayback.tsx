
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  checkAudioPlaybackPermission,
  retryPlaybackWithUserInteraction,
  setCurrentAudio
} from '@/utils/speechUtils';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const playbackAttemptCountRef = useRef(0);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);
  
  const playAudioBlob = async (audioBlob: Blob): Promise<void> => {
    try {
      // Reset playback attempt counter
      playbackAttemptCountRef.current = 0;
      
      // Create audio URL from blob
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setCurrentAudio(audio);
      
      console.log('Audio created, attempting to play...');
      
      // Check if audio playback is allowed
      const canAutoplay = await checkAudioPlaybackPermission();
      
      if (!canAutoplay) {
        console.log('Autoplay not allowed, offering user interaction button');
        toast({
          title: "Audio Playback",
          description: "Click anywhere on the page to enable audio playback",
          duration: 5000,
        });
        retryPlaybackWithUserInteraction(audio);
        setIsPlaying(false);
        return;
      }
      
      // Make sure audio loads before playing
      audio.addEventListener('canplaythrough', async () => {
        try {
          if (!isMountedRef.current) {
            URL.revokeObjectURL(audioUrl);
            return;
          }
          
          console.log('Audio can play through, starting playback...');
          setIsPlaying(true);
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Audio playing successfully');
                playbackAttemptCountRef.current = 0; // Reset counter on success
              })
              .catch(e => {
                console.error('Error during audio playback:', e);
                playbackAttemptCountRef.current++;
                
                if (playbackAttemptCountRef.current <= 3) {
                  console.log(`Retry attempt ${playbackAttemptCountRef.current}...`);
                  setTimeout(() => {
                    if (audio && isMountedRef.current) audio.play().catch(err => console.error('Retry failed:', err));
                  }, 1000);
                } else if (isMountedRef.current) {
                  toast({
                    title: 'Playback Failed',
                    description: 'Failed to play audio. Try clicking on the page first.',
                    variant: 'destructive',
                  });
                  retryPlaybackWithUserInteraction(audio);
                  setIsPlaying(false);
                }
              });
          }
        } catch (playError) {
          console.error('Error playing audio:', playError);
          if (isMountedRef.current) {
            retryPlaybackWithUserInteraction(audio);
            setIsPlaying(false);
          }
        }
      });
      
      // Set up error handler
      audio.addEventListener('error', (e) => {
        console.error('Audio error event:', e);
        if (isMountedRef.current) {
          toast({
            title: 'Audio Error',
            description: 'An error occurred while playing the audio.',
            variant: 'destructive',
          });
          setIsPlaying(false);
        }
      });
      
      // Clean up the URL object when done
      audio.onended = () => {
        console.log('Audio playback ended');
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      };
      
    } catch (error) {
      console.error('Error playing audio:', error);
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
      throw error;
    }
  };
  
  return {
    playAudioBlob,
    isPlaying,
    audioRef
  };
};
