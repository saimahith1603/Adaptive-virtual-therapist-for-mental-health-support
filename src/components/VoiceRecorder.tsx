
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cleanupExistingAudio } from '@/utils/speechUtils';

interface VoiceRecorderProps {
  onVoiceInput: (text: string) => void;
  enabled: boolean;
  isLoading: boolean;
}

export const VoiceRecorder = ({ onVoiceInput, enabled, isLoading }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            onVoiceInput(transcript);
            setIsRecording(false);
            toast({
              title: "Voice captured",
              description: "Your message has been sent",
            });
          };

          recognition.onerror = (event: SpeechRecognitionEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            toast({
              title: "Voice recognition failed",
              description: "Please try again",
              variant: "destructive",
            });
          };

          setRecognition(recognition);
          console.log("Speech recognition initialized successfully");
        } catch (error) {
          console.error("Error initializing speech recognition:", error);
          toast({
            title: "Voice recognition initialization failed",
            description: "Please try again",
            variant: "destructive",
          });
        }
      } else {
        console.error("Speech recognition not supported");
        toast({
          title: "Voice not supported",
          description: "Your browser doesn't support voice recognition",
          variant: "destructive",
        });
      }
    }
    
    return () => {
      // Clean up voice recognition
      if (recognition) {
        try {
          recognition.stop(); // Using stop() instead of abort()
        } catch (e) {
          console.error('Error cleaning up voice recognition:', e);
        }
      }
    };
  }, [onVoiceInput]);

  useEffect(() => {
    let interval: number;
    
    if (isRecording) {
      // Stop any existing audio to prevent audio overlap
      cleanupExistingAudio();
      
      // Simulate audio levels by updating with random values
      interval = window.setInterval(() => {
        setAudioLevels(prev => {
          const newLevels = [...prev];
          newLevels.shift();
          // Random value between 0.2 and 1 with more variation
          newLevels.push(Math.random() * 0.8 + 0.2); 
          return newLevels;
        });
      }, 150);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const toggleRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!recognition) {
      toast({
        title: "Voice recognition not available",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      try {
        recognition.stop();
        setIsRecording(false);
        setAudioLevels([0, 0, 0, 0, 0]);
        console.log("Voice recording stopped");
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    } else {
      // Clean up any existing audio
      cleanupExistingAudio();
      
      try {
        recognition.start();
        setIsRecording(true);
        toast({
          title: "Listening...",
          description: "Speak now to send a message",
        });
        console.log("Voice recording started");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Failed to start voice recording",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  if (!enabled) return null;

  return (
    <div className="relative">
      <Button
        onClick={toggleRecording}
        disabled={isLoading}
        variant={isRecording ? "default" : "secondary"}
        size="icon"
        className={`text-white relative ${isRecording ? 'bg-teal-400 hover:bg-teal-500' : ''}`}
        ref={buttonRef}
      >
        {isRecording ? (
          <Mic className="w-5 h-5 animate-pulse" />
        ) : isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
      
      {isRecording && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
          {audioLevels.map((level, index) => (
            <div 
              key={index}
              className="w-1 bg-teal-400 rounded-full animate-pulse"
              style={{ 
                height: `${level * 20}px`,
                animationDelay: `${index * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
